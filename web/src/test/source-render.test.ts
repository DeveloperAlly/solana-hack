import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRenderer, MAX_ORIGINS, RENDER_CSP, type InterceptedRequest, type RenderBrowser, type RenderPage } from '../../worker/sources/render';
import { readSite } from '../../worker/sources/site';
import { fetchRobots, robotsAllows } from '../../worker/sources/robots';

// Rendered reading for script-only pages (architecture §6.1; PR #71 review). The browser is a fake that issues the
// requests a real page would, through the same request-interception handler, and records how each was resolved.
// The network is a fetch stub: anything the renderer lets our own reader fetch shows up in `fetched`.

type Site = Record<string, { status?: number; headers?: Record<string, string>; body?: string }>;
const ROBOTS: Record<string, string> = {
  'https://a.test': 'User-agent: *\nDisallow: /private\nDisallow: /blocked.js\n',
  'https://cdn.test': '',
  'https://evil.test': 'User-agent: *\nDisallow: /\n',
};
let fetched: string[] = [];
function network(site: Site) {
  fetched = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    fetched.push(url);
    const u = new URL(url);
    if (u.pathname === '/robots.txt') return new Response(ROBOTS[u.origin] ?? '', { status: ROBOTS[u.origin] === undefined ? 404 : 200 });
    const page = site[url];
    if (!page) return new Response('', { status: 404 });
    return new Response(page.body ?? '', { status: page.status ?? 200, headers: page.headers ?? { 'content-type': 'text/html' } });
  }));
}
afterEach(() => vi.unstubAllGlobals());

/** A robots.txt gate like the site adapter's: one robots.txt per origin. */
function gate() {
  const cache = new Map<string, ReturnType<typeof fetchRobots>>();
  return async (u: URL) => {
    if (!cache.has(u.origin)) cache.set(u.origin, fetchRobots(u.origin));
    return robotsAllows(await cache.get(u.origin)!, u);
  };
}

type Outcome = { url: string; type: string; how: 'continue' | 'abort' | 'respond'; status?: number; headers?: Record<string, string>; body?: string };
/**
 * A fake browser. `goto` issues the main document request; when the page is answered with HTML, the page's own
 * behaviour (`after`) runs: further requests (scripts, frames, a client-side navigation). A 302 answer is followed,
 * as a browser does, with a new request. `text` is what the page shows once rendered.
 */
function fakeBrowser(after: (issue: (url: string, type: string, frame?: 'main' | 'child') => Promise<Outcome>) => Promise<void> = async () => undefined, text = 'JamJam renders on the client, and this is the text the page shows once its scripts have run.') {
  const outcomes: Outcome[] = [];
  let launched = 0;
  let closed = 0;
  const main = { name: 'main' };
  const child = { name: 'child' };
  const browser: RenderBrowser = {
    async newPage() {
      let handler: ((r: InterceptedRequest) => void) | null = null;
      let current = 'about:blank';
      let html = '';
      const issue = (url: string, type: string, frame: 'main' | 'child' = 'main') => new Promise<Outcome>((resolve) => {
        let handled = false;
        const done = (o: Omit<Outcome, 'url' | 'type'>) => {
          if (handled) throw new Error('Request is already handled!');
          handled = true;
          const out = { url, type, ...o };
          outcomes.push(out);
          resolve(out);
          return Promise.resolve();
        };
        handler!({
          url: () => url,
          resourceType: () => type,
          frame: () => (frame === 'main' ? main : child),
          isInterceptResolutionHandled: () => handled,
          continue: () => done({ how: 'continue' }),
          abort: () => done({ how: 'abort' }),
          respond: (r) => done({ how: 'respond', status: r.status, headers: r.headers, body: r.body }),
        });
      });
      // Loads a top-level document the way a browser does: follow a 302 answer, then show the page.
      const navigate = async (url: string): Promise<boolean> => {
        let target = url;
        for (let i = 0; i < 5; i++) {
          const o = await issue(target, 'document');
          if (o.how !== 'respond') return false;
          if (o.status === 302) { target = new URL(o.headers!.location, target).toString(); continue; }
          current = target;
          html = o.body ?? '';
          return true;
        }
        return false;
      };
      const page: RenderPage = {
        setUserAgent: async () => undefined,
        setBypassServiceWorker: async () => undefined,
        evaluateOnNewDocument: async () => undefined,
        setRequestInterception: async () => undefined,
        on: (_e, h) => { handler = h; },
        mainFrame: () => main,
        async goto(url) {
          if (!(await navigate(url))) throw Object.assign(new Error('net::ERR_BLOCKED_BY_CLIENT'), { name: 'Error' });
          await after(async (u, type, frame) => {
            if (type === 'document' && frame !== 'child') {
              const o = await issue(u, 'document');
              if (o.how === 'respond' && o.status !== 302) { current = u; html = o.body ?? ''; }
              return o;
            }
            return issue(u, type, frame);
          });
          return null;
        },
        url: () => current,
        title: async () => html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '',
        content: async () => html,
        evaluate: async () => text,
        close: async () => undefined,
      };
      return page;
    },
    async close() { closed++; },
  };
  return { launch: async () => { launched++; return browser; }, outcomes, stats: () => ({ launched, closed }) };
}

const APP = '<html><title>JamJam</title><body><div id="app"></div><a href="/about">About</a></body></html>';

describe('renderer: robots.txt before every request the browser makes', () => {
  it('serves the page from our own reader with a CSP, and lets through only what robots.txt allows', async () => {
    network({ 'https://a.test/': { body: APP }, 'https://a.test/app.js': {}, 'https://cdn.test/lib.js': {} });
    const b = fakeBrowser(async (issue) => {
      await issue('https://a.test/app.js', 'script');
      await issue('https://a.test/blocked.js', 'script');
      await issue('https://cdn.test/lib.js', 'script');
      await issue('https://evil.test/x.js', 'script');
      await issue('https://a.test/logo.png', 'image');
      await issue('https://a.test/frame', 'document', 'child');
      await issue('data:text/plain,hi', 'fetch');
    });
    const r = createRenderer(b.launch, gate(), 9);
    const page = await r.read(new URL('https://a.test/'));
    expect(page).toMatchObject({ url: 'https://a.test/', title: 'JamJam', links: ['https://a.test/about'] });
    expect(page!.text).toContain('text the page shows');
    const how = Object.fromEntries(b.outcomes.map((o) => [o.url, o.how]));
    expect(how).toEqual({
      'https://a.test/': 'respond',
      'https://a.test/app.js': 'continue',
      'https://a.test/blocked.js': 'abort',
      'https://cdn.test/lib.js': 'continue',
      'https://evil.test/x.js': 'abort',
      'https://a.test/logo.png': 'abort',
      'https://a.test/frame': 'abort',
      'data:text/plain,hi': 'continue',
    });
    expect(b.outcomes[0].headers).toMatchObject({ 'content-security-policy': RENDER_CSP });
    // The page itself came from our reader; nothing refused was fetched, and an image needs no robots.txt.
    expect(fetched).toContain('https://a.test/');
    expect(fetched.filter((u) => !u.endsWith('/robots.txt'))).toEqual(['https://a.test/']);
    await r.close();
  });
  it("keeps the site's own Content-Security-Policy enforced alongside the renderer's (PR #71 review)", async () => {
    network({ 'https://a.test/': { body: APP, headers: { 'content-type': 'text/html', 'content-security-policy': "script-src 'self'" } } });
    const b = fakeBrowser();
    await createRenderer(b.launch, gate(), 9).read(new URL('https://a.test/'));
    expect(b.outcomes[0].headers!['content-security-policy']).toBe(`script-src 'self', ${RENDER_CSP}`);
  });
  it('refuses a client-side navigation to a disallowed address without fetching it (meta refresh, script)', async () => {
    network({ 'https://a.test/': { body: APP } });
    const b = fakeBrowser(async (issue) => { await issue('https://a.test/private/next', 'document'); });
    const page = await createRenderer(b.launch, gate(), 9).read(new URL('https://a.test/'));
    expect(page).toMatchObject({ url: 'https://a.test/' });
    expect(b.outcomes.find((o) => o.url === 'https://a.test/private/next')?.how).toBe('abort');
    expect(fetched).not.toContain('https://a.test/private/next');
  });
  it('answers a redirect as a redirect, and checks the new address again', async () => {
    network({ 'https://a.test/old': { status: 301, headers: { location: '/new' } }, 'https://a.test/new': { body: APP } });
    const b = fakeBrowser();
    const page = await createRenderer(b.launch, gate(), 9).read(new URL('https://a.test/old'));
    expect(page).toMatchObject({ url: 'https://a.test/new' });
    expect(b.outcomes.map((o) => [o.url, o.how, o.status])).toEqual([['https://a.test/old', 'respond', 302], ['https://a.test/new', 'respond', 200]]);
  });
  it('never fetches a redirect hop robots.txt disallows, and reads nothing', async () => {
    network({ 'https://a.test/old': { status: 301, headers: { location: '/private/x' } }, 'https://a.test/private/x': { body: APP } });
    const b = fakeBrowser();
    expect(await createRenderer(b.launch, gate(), 9).read(new URL('https://a.test/old'))).toBeNull();
    expect(fetched).not.toContain('https://a.test/private/x');
  });
  it(`loads scripts and data from at most ${MAX_ORIGINS} origins`, async () => {
    network({ 'https://a.test/': { body: APP } });
    const urls = Array.from({ length: MAX_ORIGINS + 2 }, (_, i) => `https://s${i}.test/x.js`);
    const b = fakeBrowser(async (issue) => { for (const u of urls) await issue(u, 'script'); });
    await createRenderer(b.launch, gate(), 9).read(new URL('https://a.test/'));
    const continued = b.outcomes.filter((o) => o.type === 'script' && o.how === 'continue').length;
    expect(continued).toBe(MAX_ORIGINS);
    expect(fetched.filter((u) => u.endsWith('/robots.txt')).length).toBe(1 + MAX_ORIGINS);
  });
  it('launches the browser only when needed, renders at most maxPages pages, and closes it', async () => {
    network({ 'https://a.test/': { body: APP } });
    const idle = fakeBrowser();
    await createRenderer(idle.launch, gate(), 9).close();
    expect(idle.stats()).toEqual({ launched: 0, closed: 0 });
    const b = fakeBrowser();
    const r = createRenderer(b.launch, gate(), 1);
    expect(await r.read(new URL('https://a.test/'))).not.toBeNull();
    expect(await r.read(new URL('https://a.test/'))).toBeNull();
    expect(r.rendered).toBe(1);
    await r.close();
    expect(b.stats()).toEqual({ launched: 1, closed: 1 });
  });
});

describe('site adapter: rendered fallback for script-only sites (architecture §6.1)', () => {
  it('renders a home page with almost no text, and reads its subpages', async () => {
    network({
      'https://a.test/': { body: APP },
      'https://a.test/about': { body: '<html><title>About</title><body><p>JamJam helps brands prove what they say, with every fact tied to a quote.</p></body></html>' },
    });
    const b = fakeBrowser();
    const r = await readSite({}, 'https://a.test/', { website: 'a.test' }, (g, max) => createRenderer(b.launch, g, max));
    expect(r).toMatchObject({ ok: true, kind: 'site', meta: { pages: 2 } });
    if (!r.ok || r.kind === 'document') throw new Error('expected a site read');
    expect(r.pages!.map((p) => p.url)).toEqual(['https://a.test/', 'https://a.test/about']);
    expect(r.pages![0].text).toContain('text the page shows');
    expect(r.meta.notes.join(' ')).toContain('1 script-only page(s) rendered in a browser');
    expect(b.stats()).toEqual({ launched: 1, closed: 1 });
  });
  it('without a renderer, a script-only site still asks for the text to be pasted', async () => {
    network({ 'https://a.test/': { body: APP } });
    const r = await readSite({}, 'https://a.test/', { website: 'a.test' });
    expect(r).toMatchObject({ ok: false, code: 'unreadable' });
  });
});
