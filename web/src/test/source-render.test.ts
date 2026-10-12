import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRenderer, launchFailure, MAX_ORIGINS, MAX_REQUESTS, PAGE_TEXT, RENDER_CSP, type InterceptedRequest, type RenderBrowser, type RenderPage } from '../../worker/sources/render';
import { BROWSER_UNAVAILABLE, readSite } from '../../worker/sources/site';
import { fetchRobots, robotsAllows } from '../../worker/sources/robots';
import { MAX_BYTES } from '../../worker/ingest';

// Rendered reading for script-only pages (architecture §6.1; PR #71 review). The browser is a fake that issues the
// requests a real page would, through the same request-interception handler, and records how each was resolved.
// The network is a fetch stub: anything the renderer lets our own reader fetch shows up in `fetched`.

type Site = Record<string, { status?: number; headers?: Record<string, string> | [string, string][]; body?: string }>;
const ROBOTS: Record<string, string> = {
  'https://a.test': 'User-agent: *\nDisallow: /private\nDisallow: /blocked.js\n',
  'https://cdn.test': '',
  'https://evil.test': 'User-agent: *\nDisallow: /\n',
};
let fetched: string[] = [];
let sentCookies: Record<string, string> = {};
function network(site: Site | ((url: string) => Site[string] | undefined)) {
  fetched = [];
  sentCookies = {};
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    fetched.push(url);
    const cookie = (init?.headers as Record<string, string> | undefined)?.cookie;
    if (cookie) sentCookies[url] = cookie;
    const u = new URL(url);
    if (u.pathname === '/robots.txt') return new Response(ROBOTS[u.origin] ?? '', { status: ROBOTS[u.origin] === undefined ? 404 : 200 });
    const page = typeof site === 'function' ? site(url) : site[url];
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

type Outcome = { url: string; type: string; how: 'continue' | 'abort' | 'respond'; status?: number; headers?: Record<string, string | string[]>; body?: string };
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
      // The browser's cookie jar: filled from Set-Cookie on the responses it is handed.
      const jar = new Map<string, string>();
      const keep = (o: Outcome) => {
        const set = o.headers?.['set-cookie'];
        for (const c of Array.isArray(set) ? set : set ? [set] : []) { const [nv] = c.split(';'); const i = nv.indexOf('='); jar.set(nv.slice(0, i).trim(), nv.slice(i + 1).trim()); }
      };
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
        for (let i = 0; i < 1000; i++) {
          const o = await issue(target, 'document');
          if (o.how !== 'respond') return false;
          keep(o);
          if (o.status! >= 300 && o.status! < 400) { target = new URL(String(o.headers!.location), target).toString(); continue; }
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
        cookies: async () => [...jar].map(([name, value]) => ({ name, value })),
        async goto(url) {
          if (!(await navigate(url))) throw Object.assign(new Error('net::ERR_BLOCKED_BY_CLIENT'), { name: 'Error' });
          await after(async (u, type, frame) => {
            if (type === 'document' && frame !== 'child') {
              const o = await issue(u, 'document');
              if (o.how === 'respond') keep(o);
              if (o.how === 'respond' && !(o.status! >= 300 && o.status! < 400)) { current = u; html = o.body ?? ''; }
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
  it("passes the page's cookies and headers to the browser, leaving out transfer headers (PR #71 review)", async () => {
    network({ 'https://a.test/': { body: APP, headers: [['content-type', 'text/html'], ['set-cookie', 'sid=1; Path=/'], ['set-cookie', 'locale=en; Path=/'], ['content-language', 'en'], ['content-encoding', 'gzip']] } });
    const b = fakeBrowser();
    await createRenderer(b.launch, gate(), 9).read(new URL('https://a.test/'));
    const h = b.outcomes[0].headers!;
    expect(h['set-cookie']).toEqual(['sid=1; Path=/', 'locale=en; Path=/']);
    expect(h['content-language']).toBe('en');
    expect(h['content-encoding']).toBeUndefined();
    expect(h['content-security-policy']).toBe(RENDER_CSP);
  });
  it(`lets one page cause at most ${MAX_REQUESTS} requests, whatever its scripts do (PR #71 review)`, async () => {
    network({ 'https://a.test/': { body: APP } });
    const b = fakeBrowser(async (issue) => { for (let i = 0; i < MAX_REQUESTS + 20; i++) await issue(`https://a.test/api/${i}`, 'fetch'); });
    await createRenderer(b.launch, gate(), 9).read(new URL('https://a.test/'));
    // The page load itself is one of them.
    expect(b.outcomes.filter((o) => o.type === 'fetch' && o.how === 'continue')).toHaveLength(MAX_REQUESTS - 1);
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
    expect(b.outcomes.map((o) => [o.url, o.how, o.status])).toEqual([['https://a.test/old', 'respond', 301], ['https://a.test/new', 'respond', 200]]);
  });
  it('hands a redirect over with its cookies, and sends them on the next hop (PR #71 review)', async () => {
    network({ 'https://a.test/old': { status: 302, headers: [['location', '/new'], ['set-cookie', 'consent=yes; Path=/']] }, 'https://a.test/new': { body: APP } });
    const b = fakeBrowser();
    expect(await createRenderer(b.launch, gate(), 9).read(new URL('https://a.test/old'))).toMatchObject({ url: 'https://a.test/new' });
    expect(b.outcomes[0].headers!['set-cookie']).toEqual(['consent=yes; Path=/']);
    expect(sentCookies['https://a.test/new']).toBe('consent=yes');
  });
  it('charges every redirect hop to the page budget (PR #71 review)', async () => {
    // /hop0 redirects 15 times before reaching the page, and the page's script navigates back to /hop0 again and again.
    network((url) => {
      const n = Number(new URL(url).pathname.slice(4));
      return n < 15 ? { status: 302, headers: { location: `/hop${n + 1}` } } : { body: APP };
    });
    const b = fakeBrowser(async (issue) => { for (let i = 0; i < 40; i++) await issue('https://a.test/hop0', 'document'); });
    await createRenderer(b.launch, gate(), 9).read(new URL('https://a.test/hop0'));
    expect(fetched.filter((u) => !u.endsWith('/robots.txt')).length).toBeLessThanOrEqual(MAX_REQUESTS);
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
  it('renders a script-only home page even when its title alone is long (PR #71 review)', async () => {
    const shell = '<html><head><title>JamJam: build your brand, run it, and prove it on Solana</title></head><body><div id="app"></div></body></html>';
    network({ 'https://a.test/': { body: shell } });
    const b = fakeBrowser();
    const r = await readSite({}, 'https://a.test/', { website: 'a.test', subpages: 0 }, (g, max) => createRenderer(b.launch, g, max));
    expect(r).toMatchObject({ ok: true });
    if (!r.ok || r.kind === 'document') throw new Error('expected a site read');
    expect(r.pages![0].text).toContain('text the page shows');
  });
  it("does not accept Exa's cached shell with almost no text; renders the page instead (PR #71 review)", async () => {
    network((url) => (url === 'https://api.exa.ai/contents' ? undefined : url === 'https://a.test/' ? { body: APP } : undefined));
    const real = globalThis.fetch as unknown as (u: string, i?: RequestInit) => Promise<Response>;
    vi.stubGlobal('fetch', vi.fn(async (u: string, i?: RequestInit) => (u === 'https://api.exa.ai/contents' ? new Response(JSON.stringify({ results: [{ url: 'https://a.test/', title: 'A', text: 'Loading...', extras: { links: [] } }] })) : real(u, i))));
    const b = fakeBrowser();
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://a.test/', { website: 'a.test', subpages: 0 }, (g, max) => createRenderer(b.launch, g, max));
    expect(r).toMatchObject({ ok: true });
    if (!r.ok || r.kind === 'document') throw new Error('expected a site read');
    expect(r.pages![0].text).toContain('text the page shows');
  });
  it('without a renderer, a script-only site still asks for the text to be pasted', async () => {
    network({ 'https://a.test/': { body: APP } });
    const r = await readSite({}, 'https://a.test/', { website: 'a.test' });
    expect(r).toMatchObject({ ok: false, code: 'unreadable' });
  });
});

/** A response body of `total` bytes of HTML, produced on demand, that records how much of it was read. */
function bigHtml(total: number, chunk = 64 * 1024) {
  const seen = { pulled: 0, cancelled: false };
  const filler = new TextEncoder().encode('<p>JamJam helps brands prove what they say.</p>'.repeat(Math.ceil(chunk / 47)).slice(0, chunk));
  const body = new ReadableStream<Uint8Array>({
    pull(c) {
      if (seen.pulled >= total) return c.close();
      const n = Math.min(chunk, total - seen.pulled);
      seen.pulled += n;
      c.enqueue(filler.slice(0, n));
    },
    cancel() { seen.cancelled = true; },
  });
  return { body, seen };
}

describe('renderer: bounded reads (PR #71 review)', () => {
  it(`hands the browser at most ${MAX_BYTES} bytes of a page, and stops reading the response there`, async () => {
    const big = bigHtml(8 * MAX_BYTES);
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (new URL(url).pathname === '/robots.txt' ? new Response('', { status: 404 }) : new Response(big.body, { headers: { 'content-type': 'text/html' } }))));
    const b = fakeBrowser();
    await createRenderer(b.launch, gate(), 9).read(new URL('https://a.test/'));
    const handed = b.outcomes.find((o) => o.url === 'https://a.test/');
    expect(handed?.how).toBe('respond');
    expect(new TextEncoder().encode(handed!.body).length).toBeLessThanOrEqual(MAX_BYTES);
    // Read up to the cap, plus at most the chunks the stream had queued, then cancelled.
    expect(big.seen.pulled).toBeLessThan(MAX_BYTES + 4 * 64 * 1024);
    expect(big.seen.cancelled).toBe(true);
  });
  it('reads page text without removing stylesheets, so content a stylesheet hides stays hidden', () => {
    const removed: string[] = [];
    const hidden: string[] = [];
    const selectors: string[] = [];
    const el = (tag: string) => ({ remove: () => removed.push(tag), style: { setProperty: (p: string, v: string, pr: string) => hidden.push(`${tag} ${p}:${v} ${pr}`) } });
    const doc = { querySelectorAll: (sel: string) => { selectors.push(sel); return sel.split(',').map(el); }, body: { innerText: 'What the page shows.' } };
    const text = new Function('document', `return ${PAGE_TEXT}`)(doc);
    expect(text).toBe('What the page shows.');
    // innerText already leaves out scripts, styles, templates and hidden elements; only the reader's own furniture is hidden.
    expect(removed).toEqual([]);
    expect(selectors.join(',').split(',')).toEqual(['svg', 'nav', 'footer']);
    expect(hidden).toEqual(['svg display:none important', 'nav display:none important', 'footer display:none important']);
  });
});

describe('site adapter: a shell whose only text is not shown is rendered (PR #71 review)', () => {
  const cases: [string, string][] = [
    ['a template', `<template><p>${'Hidden template text for a later render. '.repeat(3)}</p></template>`],
    ['a nested template', `<template><template>x</template><p>${'Text after an inner template. '.repeat(3)}</p></template>`],
    ['an element with the hidden attribute', `<div hidden><p>${'Text kept for later in a hidden block. '.repeat(3)}</p></div>`],
    ['a dialog that is not open', `<dialog><p>${'Cookie notice text that is not open yet. '.repeat(3)}</p></dialog>`],
    ['an inline display: none', `<div style="color: red; display : none !important"><p>${'Text a style keeps hidden from view. '.repeat(3)}</p></div>`],
    ['an iframe fallback', `<iframe src="/x"><p>${'Fallback text a browser never shows. '.repeat(3)}</p></iframe>`],
  ];
  for (const [what, inert] of cases) {
    it(`renders the page when its only text is in ${what}`, async () => {
      network({ 'https://a.test/': { body: `<html><title>JamJam</title><body><div id="app"></div>${inert}<script src="/app.js"></script></body></html>` } });
      const b = fakeBrowser();
      const r = await readSite({}, 'https://a.test/', { website: 'a.test', subpages: 0 }, (g, max) => createRenderer(b.launch, g, max));
      expect(r).toMatchObject({ ok: true });
      if (!r.ok || r.kind === 'document') throw new Error('expected a site read');
      expect(r.pages![0].text).toContain('text the page shows');
      expect(r.meta.notes.join(' ')).toContain('1 script-only page(s) rendered in a browser');
    });
  }
});

describe('site adapter: no browser to be had (Browser Run limits)', () => {
  // The launch error Browser Run gives once the Workers Free daily browser time is used up
  // (https://developers.cloudflare.com/browser-run/limits/, "429 Browser time limit exceeded for today").
  const quotaError = () => Object.assign(new Error('Error processing the request: Unable to create new browser: code: 429: message: Browser time limit exceeded for today'), { status: 429 });
  it('ends a script-only site in "paste instead", says why, and does not launch again for each page', async () => {
    network({ 'https://a.test/': { body: '<html><title>A</title><body><div id="app"></div><a href="/about">About</a></body></html>' }, 'https://a.test/about': { body: APP } });
    let launches = 0;
    const r = await readSite({}, 'https://a.test/', { website: 'a.test' }, (g, max) => createRenderer(async () => { launches++; throw quotaError(); }, g, max));
    expect(r).toMatchObject({ ok: false, code: 'unreadable' });
    expect(r.ok ? '' : r.reason).toMatch(/Paste the key text/);
    expect(r.meta.notes).toContain(BROWSER_UNAVAILABLE.quota);
    expect(launches).toBe(1);
  });
  it('tells a used-up daily quota from a refused new browser and from any other launch failure', () => {
    expect(launchFailure(quotaError())).toBe('quota');
    expect(launchFailure(Object.assign(new Error('Unable to create new browser: code: 429: message: Too many browsers already running'), { status: 429 }))).toBe('rate_limited');
    expect(launchFailure(new Error('Unable to create new browser: code: 429: message: Rate limit exceeded'))).toBe('rate_limited');
    expect(launchFailure(new Error('socket hang up'))).toBe('failed');
  });
  it('still reads pages that need no browser when the browser is unavailable, and notes it', async () => {
    network({ 'https://a.test/': { body: `<html><title>A</title><body><p>JamJam helps brands prove what they say, with every fact tied to a quote.</p><a href="/app">App</a></body></html>` }, 'https://a.test/app': { body: APP } });
    const r = await readSite({}, 'https://a.test/', { website: 'a.test' }, (g, max) => createRenderer(async () => { throw quotaError(); }, g, max));
    expect(r).toMatchObject({ ok: true, meta: { pages: 1 } });
    expect(r.meta.notes).toContain(BROWSER_UNAVAILABLE.quota);
  });
});
