import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSite, siteUrl, SITE_DEFAULTS } from '../../worker/sources/site';
import { allowedBy, normalisePath, parseRobots } from '../../worker/sources/robots';

// Site adapter (issue #33). Exa, the site and the page renderer are mocked; each test sets what they answer.
type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;
function stub(routes: { robots?: Handler; exa?: Handler; page?: Handler; render?: Handler }) {
  const calls: { url: string; body?: unknown }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    if (url.endsWith('/robots.txt')) return routes.robots ? routes.robots(url, init) : new Response('', { status: 404 });
    if (url.startsWith('https://api.exa.ai/')) return routes.exa ? routes.exa(url, init) : new Response('', { status: 500 });
    if (url.startsWith('https://api.cloudflare.com/')) return routes.render ? routes.render(url, init) : new Response('', { status: 500 });
    return routes.page ? routes.page(url, init) : new Response('', { status: 500 });
  }));
  return calls;
}
afterEach(() => vi.unstubAllGlobals());

const html = (title: string, body: string) => new Response(`<html><title>${title}</title><body><p>${body}</p></body></html>`, { headers: { 'content-type': 'text/html' } });
const exaReply = (pages: { url: string; title: string; text: string }[], cost = 0.009) => new Response(JSON.stringify({
  results: [{ ...pages[0], subpages: pages.slice(1) }], statuses: [{ id: pages[0].url, status: 'success' }], costDollars: { total: cost },
}));
const LONG = 'JamJam helps brands prove what they say, with every fact tied to a quote from its source.';

describe('site adapter: Exa first', () => {
  it('reads the home page and key subpages in one Exa call, with the documented request shape', async () => {
    const calls = stub({ exa: () => exaReply([{ url: 'https://jamjam.tech/', title: 'JamJam', text: LONG }, { url: 'https://jamjam.tech/about', title: 'About', text: 'About us.' }, { url: 'https://jamjam.tech/pricing', title: 'Pricing', text: 'Free plan.' }]) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'jamjam.tech', { website: 'https://jamjam.tech' });
    expect(r).toMatchObject({ ok: true, kind: 'site', trust: 'owned', url: 'https://jamjam.tech/', title: 'JamJam', meta: { pages: 3, cost: 0.009, via: 'exa' } });
    if (!r.ok) throw new Error('expected ok');
    expect(r.pages?.map((p) => p.url)).toEqual(['https://jamjam.tech/', 'https://jamjam.tech/about', 'https://jamjam.tech/pricing']);
    expect(r.text).toContain('Free plan.');
    const exa = calls.filter((c) => c.url === 'https://api.exa.ai/contents');
    expect(exa).toHaveLength(1);
    expect(exa[0].body).toMatchObject({ urls: ['https://jamjam.tech/'], subpages: SITE_DEFAULTS.subpages, subpageTarget: SITE_DEFAULTS.subpageTarget, text: { maxCharacters: SITE_DEFAULTS.maxCharacters } });
  });
  it('drops subpages robots.txt disallows, and says so', async () => {
    stub({
      robots: () => new Response('User-agent: *\nDisallow: /private\n'),
      exa: () => exaReply([{ url: 'https://jamjam.tech/', title: 'JamJam', text: LONG }, { url: 'https://jamjam.tech/private/plan', title: 'Plan', text: 'secret' }]),
    });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/');
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://jamjam.tech/']);
    expect(r.meta.notes.join(' ')).toMatch(/robots\.txt disallows/);
  });
  it('estimates cost from Exa pricing when the reply has no cost', async () => {
    stub({ exa: () => new Response(JSON.stringify({ results: [{ url: 'https://a.test/', title: 'A', text: LONG, subpages: [{ url: 'https://a.test/b', title: 'B', text: 'b' }] }] })) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://a.test/');
    expect(r.meta.cost).toBe(0.002);
  });
});

describe('site adapter: trust follows the brand website (PR #63 review)', () => {
  it('a page off the brand website is third-party, and so is one with no website set', async () => {
    stub({ page: () => html('News', LONG) });
    expect(await readSite({}, 'https://news.test/story', { website: 'jamjam.tech' })).toMatchObject({ ok: true, kind: 'page', trust: 'third_party' });
    expect(await readSite({}, 'https://jamjam.tech/', {})).toMatchObject({ ok: true, kind: 'page', trust: 'third_party' });
  });
  it('a subdomain of the website is owned; a redirect off the website is classified on where it landed', async () => {
    stub({ page: () => html('Docs', LONG) });
    expect(await readSite({}, 'https://docs.jamjam.tech/', { website: 'www.jamjam.tech' })).toMatchObject({ ok: true, kind: 'site', trust: 'owned' });
    stub({ exa: () => exaReply([{ url: 'https://elsewhere.test/', title: 'Elsewhere', text: LONG }]) });
    expect(await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/go', { website: 'jamjam.tech' })).toMatchObject({ ok: true, kind: 'page', trust: 'third_party' });
  });
  it('drops subpages off the website, so one result never mixes owned and third-party text', async () => {
    stub({ exa: () => exaReply([{ url: 'https://jamjam.tech/', title: 'JamJam', text: LONG }, { url: 'https://partner.test/jamjam', title: 'Partner', text: 'claims' }]) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://jamjam.tech/']);
    expect(r.meta.notes.join(' ')).toMatch(/not on the same site/);
  });
});

describe('site adapter: fallbacks', () => {
  it('without an Exa key, reads the home page directly and says Exa is not configured', async () => {
    const calls = stub({ page: () => html('aDNA', LONG) });
    const r = await readSite({}, 'adna.network');
    expect(r).toMatchObject({ ok: true, title: 'aDNA', meta: { pages: 1, cost: 0, via: 'fetch' } });
    expect(r.meta.notes.join(' ')).toMatch(/Exa is not configured/);
    expect(calls.some((c) => c.url.startsWith('https://api.exa.ai/'))).toBe(false);
  });
  it('when Exa fails, reads the home page directly', async () => {
    stub({ exa: () => new Response('{}', { status: 402 }), page: () => html('aDNA', LONG) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'adna.network');
    expect(r).toMatchObject({ ok: true, meta: { via: 'fetch' } });
    expect(r.meta.notes.join(' ')).toMatch(/Exa answered HTTP 402/);
  });
  it('uses rendered Markdown for a script-only page, when the renderer is configured', async () => {
    const calls = stub({ page: () => html('App', '<script>x</script>'), render: () => new Response(JSON.stringify({ success: true, result: `# App\n\n${LONG}` })) });
    const r = await readSite({ CF_ACCOUNT_ID: 'acc', CF_BROWSER_TOKEN: 't' }, 'https://app.test/');
    expect(r).toMatchObject({ ok: true, meta: { via: 'rendered' } });
    expect(calls.find((c) => c.url.startsWith('https://api.cloudflare.com/'))?.url).toBe('https://api.cloudflare.com/client/v4/accounts/acc/browser-rendering/markdown');
  });
  it('asks for a paste when every path fails, and never throws', async () => {
    stub({ page: () => new Response('nope', { status: 503 }) });
    const r = await readSite({}, 'https://down.test/');
    expect(r).toMatchObject({ ok: false, code: 'unreadable', reason: expect.stringContaining('Paste the key text') });
    expect(r.meta.notes.join(' ')).toMatch(/rendered Markdown is not configured/);
  });
  it('refuses what is not a web address', async () => {
    for (const bad of ['javascript:alert(1)', 'ftp://x.test/', 'https://x.test:8080/', '']) {
      const r = await readSite({}, bad);
      expect(r).toMatchObject({ ok: false, code: 'invalid_input' });
    }
    expect(siteUrl('example.com/a#b')?.toString()).toBe('https://example.com/a');
  });
});

describe('site adapter: robots.txt (RFC 9309)', () => {
  it('does not read a page robots.txt disallows for every agent', async () => {
    const calls = stub({ robots: () => new Response('User-agent: *\nDisallow: /\n'), exa: () => exaReply([{ url: 'https://x.test/', title: 'X', text: LONG }]) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://x.test/');
    expect(r).toMatchObject({ ok: false, code: 'robots_disallowed' });
    expect(calls.some((c) => c.url.startsWith('https://api.exa.ai/'))).toBe(false);
  });
  it('treats an unreachable robots.txt (5xx) as disallow, and a missing one (4xx) as allow', async () => {
    stub({ robots: () => new Response('', { status: 503 }), page: () => html('X', LONG) });
    expect(await readSite({}, 'https://x.test/')).toMatchObject({ ok: false, code: 'robots_disallowed', reason: expect.stringContaining('could not read') });
    stub({ robots: () => new Response('', { status: 404 }), page: () => html('X', LONG) });
    expect(await readSite({}, 'https://x.test/')).toMatchObject({ ok: true });
  });
  it('compares percent-encoded paths as RFC 9309 §2.2.2 requires (PR #67 review)', () => {
    // RFC 9309 Figure 4 rows.
    expect(normalisePath('/foo/bar/%62%61%7A')).toBe('/foo/bar/baz');
    expect(normalisePath('/foo/bar/\u30C4')).toBe('/foo/bar/%E3%83%84');
    expect(normalisePath('/foo/bar/%e3%83%84')).toBe('/foo/bar/%E3%83%84');
    expect(normalisePath('/foo/bar?baz=https%3A%2F%2Ffoo.bar')).toBe('/foo/bar?baz=https%3A%2F%2Ffoo.bar');
    const rules = parseRobots('User-agent: *\nDisallow: /private\nDisallow: /caf%C3%A9\n');
    expect(allowedBy(rules, '/%70rivate')).toBe(false);
    expect(allowedBy(rules, '/caf\u00E9/menu')).toBe(false);
    expect(allowedBy(rules, '/public')).toBe(true);
  });
  it('checks robots.txt of each origin a page comes from, including an apex-to-www redirect (PR #67 review)', async () => {
    const calls = stub({
      robots: (u) => new Response(u.startsWith('https://www.jamjam.tech') ? 'User-agent: *\nDisallow: /team\n' : ''),
      exa: () => exaReply([{ url: 'https://www.jamjam.tech/', title: 'JamJam', text: LONG }, { url: 'https://www.jamjam.tech/team', title: 'Team', text: 'people' }, { url: 'https://www.jamjam.tech/about', title: 'About', text: 'about' }]),
    });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    expect(r).toMatchObject({ ok: true, kind: 'site', trust: 'owned' });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://www.jamjam.tech/', 'https://www.jamjam.tech/about']);
    expect(calls.filter((c) => c.url.endsWith('/robots.txt')).map((c) => c.url)).toEqual(['https://jamjam.tech/robots.txt', 'https://www.jamjam.tech/robots.txt']);
  });
  it('never merges two unrelated third-party sites, and refuses a redirect into a disallowed origin', async () => {
    stub({ exa: () => exaReply([{ url: 'https://news.test/a', title: 'News', text: LONG }, { url: 'https://other.test/b', title: 'Other', text: 'x' }]) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://news.test/a', { website: 'jamjam.tech' });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://news.test/a']);
    stub({
      robots: (u) => new Response(u.startsWith('https://blocked.test') ? 'User-agent: *\nDisallow: /\n' : ''),
      page: () => Object.defineProperty(html('B', LONG), 'url', { value: 'https://blocked.test/' }),
    });
    const f = await readSite({}, 'https://open.test/go');
    expect(f).toMatchObject({ ok: false, code: 'unreadable' });
    expect(f.meta.notes.join(' ')).toMatch(/robots\.txt does not let us read/);
  });
  it('applies our own group over *, the longest match, allow on a tie, * and $', () => {
    const rules = parseRobots('User-agent: *\nDisallow: /\n\nUser-agent: JamJamBot\nDisallow: /admin\nAllow: /admin/public$\nDisallow: /*.pdf$\n');
    expect(allowedBy(rules, '/')).toBe(true);
    expect(allowedBy(rules, '/admin/x')).toBe(false);
    expect(allowedBy(rules, '/admin/public')).toBe(true);
    expect(allowedBy(rules, '/admin/public/more')).toBe(false);
    expect(allowedBy(rules, '/deck.pdf')).toBe(false);
    expect(allowedBy(parseRobots('User-agent: *\nAllow: /a\nDisallow: /a\n'), '/a')).toBe(true);
    expect(allowedBy(parseRobots('User-agent: other\nDisallow: /\n'), '/')).toBe(true);
  });
});
