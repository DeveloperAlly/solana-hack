import { afterEach, describe, expect, it, vi } from 'vitest';
import { exaReplyCap, MAX_SITE_REQUESTS, readSite, siteUrl, SITE_DEFAULTS } from '../../worker/sources/site';
import { MAX_BYTES, pageLinks, readCapped, readPage } from '../../worker/ingest';
import { allowedBy, normalisePath, parseRobots, ROBOTS_MAX_BYTES, ruleMatches } from '../../worker/sources/robots';

// Site adapter (issue #33). Exa and the site are mocked; each test sets what they answer. Any call to Cloudflare's
// page renderer is recorded too, to show none is made.
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
// A mock Exa for one site (each page given real text, since a cached copy with almost no text is treated as a shell): the call with `extras` reads the home page (pages[0]) and lists the other pages as its links;
// any other call returns the pages it names, in the order asked.
type ExaMockPage = { url: unknown; title?: string; text?: string };
const exaSite = (pages: ExaMockPage[], cost: number | null = 0.009, links?: unknown[]): Handler => (_url, init) => {
  const body = JSON.parse(String(init?.body ?? '{}')) as { urls: string[]; extras?: unknown };
  const results = body.extras
    ? [{ ...pages[0], extras: { links: links ?? pages.slice(1).map((p) => p.url) } }]
    : body.urls.map((u) => pages.find((p) => p.url === u)).filter(Boolean);
  return new Response(JSON.stringify({ results, statuses: body.urls.map((id) => ({ id, status: 'success' })), ...(cost === null ? {} : { costDollars: { total: cost } }) }));
};
const LONG = 'JamJam helps brands prove what they say, with every fact tied to a quote from its source.';

describe('site adapter: Exa first', () => {
  it('reads the home page with its links, then only the chosen key subpages, with the documented request shape', async () => {
    const calls = stub({ exa: exaSite([{ url: 'https://jamjam.tech/', title: 'JamJam', text: LONG }, { url: 'https://jamjam.tech/about', title: 'About', text: `About us. ${LONG}` }, { url: 'https://jamjam.tech/pricing', title: 'Pricing', text: `Free plan. ${LONG}` }]) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'jamjam.tech', { website: 'https://jamjam.tech' });
    expect(r).toMatchObject({ ok: true, kind: 'site', trust: 'owned', url: 'https://jamjam.tech/', title: 'JamJam', meta: { pages: 3, cost: 0.018, via: 'exa' } });
    if (!r.ok) throw new Error('expected ok');
    expect(r.pages?.map((p) => p.url)).toEqual(['https://jamjam.tech/', 'https://jamjam.tech/about', 'https://jamjam.tech/pricing']);
    expect(r.text).toContain('Free plan.');
    const exa = calls.filter((c) => c.url === 'https://api.exa.ai/contents');
    expect(exa).toHaveLength(2);
    expect(exa[0].body).toEqual({ urls: ['https://jamjam.tech/'], text: { maxCharacters: SITE_DEFAULTS.maxCharacters }, extras: { links: 100 }, maxAgeHours: -1 });
    // Exa's own subpage crawl is never asked for; the chosen links are named, ranked by the key-page terms. Every call
    // is cache-only (maxAgeHours -1), so our request never makes Exa fetch a page (PR #71 review).
    expect(exa[1].body).toEqual({ urls: ['https://jamjam.tech/about', 'https://jamjam.tech/pricing'], text: { maxCharacters: SITE_DEFAULTS.maxCharacters }, maxAgeHours: -1 });
  });
  it('reads a chosen page Exa has not cached with our own gated reader (PR #71 review)', async () => {
    const calls = stub({
      robots: () => new Response('User-agent: *\nDisallow: /private\n'),
      // Exa has the home page and /about cached, not /pricing.
      exa: exaSite([{ url: 'https://jamjam.tech/', title: 'JamJam', text: LONG }, { url: 'https://jamjam.tech/about', title: 'About', text: `About us. ${LONG}` }], 0.009, ['https://jamjam.tech/about', 'https://jamjam.tech/pricing']),
      page: (u) => (u === 'https://jamjam.tech/pricing' ? html('Pricing', 'Free plan for every brand, with a paid plan for teams.') : new Response('', { status: 200 })),
    });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://jamjam.tech/', 'https://jamjam.tech/about', 'https://jamjam.tech/pricing']);
    expect(calls.filter((c) => c.url.startsWith('https://api.exa.ai/')).every((c) => (c.body as { maxAgeHours?: number }).maxAgeHours === -1)).toBe(true);
  });
  it('takes the links from the page itself when Exa returns the home page without them (PR #71 review)', async () => {
    const home = `<html><title>JamJam</title><body><p>${LONG}</p><a href="/about">About</a></body></html>`;
    stub({
      exa: () => new Response(JSON.stringify({ results: [{ url: 'https://jamjam.tech/', title: 'JamJam', text: LONG }] })),
      page: (u) => (u === 'https://jamjam.tech/' ? new Response(home, { headers: { 'content-type': 'text/html' } }) : html('About', 'JamJam was started in Melbourne to help brands prove what they say.')),
    });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    expect(r).toMatchObject({ ok: true, meta: { via: 'exa' } });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://jamjam.tech/', 'https://jamjam.tech/about']);
    expect(r.meta.notes.join(' ')).toMatch(/Exa returned no links/);
  });
  it('scopes subpages from where the link landed, so a redirect onto the brand site keeps its subpages (PR #71 review)', async () => {
    const home = `<html><title>JamJam</title><body><p>${LONG}</p><a href="/about">About</a></body></html>`;
    stub({
      page: (u) => (u === 'https://old-name.test/' ? new Response(null, { status: 301, headers: { location: 'https://jamjam.tech/' } })
        : u === 'https://jamjam.tech/' ? new Response(home, { headers: { 'content-type': 'text/html' } })
        : html('About', 'JamJam was started in Melbourne to help brands prove what they say.')),
    });
    const r = await readSite({}, 'https://old-name.test/', { website: 'jamjam.tech' });
    expect(r).toMatchObject({ ok: true, kind: 'site', url: 'https://jamjam.tech/' });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://jamjam.tech/', 'https://jamjam.tech/about']);
  });
  it('reads links with a real HTML tokenizer: quoted >, a target-only <base> first, entities, inert elements (PR #71 review)', () => {
    const html = '<base target="_blank"><base href="/docs/"><a title="1 > 0" href="about">x</a><a href="faq?a=1&amp;b=2">f</a>'
      + '<template><a href="/tpl">t</a></template><noscript><a href="/ns">n</a></noscript><script>var s = "<a href=/s>";</script><!-- <a href=/c> -->';
    expect(pageLinks(html, new URL('https://jamjam.tech/'))).toEqual(['https://jamjam.tech/docs/about', 'https://jamjam.tech/docs/faq?a=1&b=2']);
  });
  it('resolves relative links against the page\'s <base href> (PR #71 review)', async () => {
    const home = `<html><head><base href="/docs/"><title>JamJam</title></head><body><p>${LONG}</p><a href="about">About</a></body></html>`;
    const calls = stub({ page: (u) => (u === 'https://jamjam.tech/' ? new Response(home, { headers: { 'content-type': 'text/html' } }) : html('About', LONG)) });
    const r = await readSite({}, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://jamjam.tech/', 'https://jamjam.tech/docs/about']);
    expect(calls.map((c) => c.url)).not.toContain('https://jamjam.tech/about');
  });
  it('reads the linked pages of a home page that is mostly navigation (PR #71 review)', async () => {
    const home = '<html><title>JamJam</title><body><nav><a href="/about">About</a></nav></body></html>';
    stub({ page: (u) => (u === 'https://jamjam.tech/' ? new Response(home, { headers: { 'content-type': 'text/html' } }) : html('About', LONG)) });
    const r = await readSite({}, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    expect(r).toMatchObject({ ok: true, url: 'https://jamjam.tech/about', meta: { via: 'fetch', pages: 1 } });
    expect(r.meta.notes.join(' ')).toMatch(/almost no readable text; its linked pages were read/);
  });
  it('caps links after removing duplicates and fragments, so later key pages are not crowded out (PR #71 review)', () => {
    const noise = Array.from({ length: 500 }, (_, i) => `<a href="#s${i}">s</a><a href="/">home</a>`).join('');
    const links = pageLinks(`${noise}<a href="/about">About</a>`, new URL('https://jamjam.tech/'));
    expect(links).toContain('https://jamjam.tech/about');
  });
  it('ignores link-shaped text in scripts, styles and comments (PR #71 review)', async () => {
    const home = `<html><title>JamJam</title><body><p>${LONG}</p><script>const t = '<a href="/script-route">x</a>';</script><!-- <a href="/commented">old</a> --><a href="/about">About</a></body></html>`;
    const calls = stub({ page: (u) => (u === 'https://jamjam.tech/' ? new Response(home, { headers: { 'content-type': 'text/html' } }) : html('About', LONG)) });
    const r = await readSite({}, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://jamjam.tech/', 'https://jamjam.tech/about']);
    expect(calls.map((c) => c.url)).not.toContain('https://jamjam.tech/script-route');
    expect(calls.map((c) => c.url)).not.toContain('https://jamjam.tech/commented');
  });
  it('without Exa, reads the home page and its key subpages from its own links (PR #71 review)', async () => {
    const home = `<html><title>JamJam</title><body><p>${LONG}</p><a href=/about>About</a> <a href='/private/x'>x</a> <a href="https://elsewhere.test/">e</a> <a href="#top">top</a></body></html>`;
    const calls = stub({
      robots: () => new Response('User-agent: *\nDisallow: /private\n'),
      page: (u) => (u === 'https://jamjam.tech/' ? new Response(home, { headers: { 'content-type': 'text/html' } }) : html('About', 'JamJam was started in Melbourne to help brands prove what they say.')),
    });
    const r = await readSite({}, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    expect(r).toMatchObject({ ok: true, meta: { via: 'fetch', pages: 2 } });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://jamjam.tech/', 'https://jamjam.tech/about']);
    expect(calls.map((c) => c.url)).not.toContain('https://jamjam.tech/private/x');
    expect(calls.map((c) => c.url)).not.toContain('https://elsewhere.test/');
  });
  it('gives Exa only addresses whose every redirect hop robots.txt allows (PR #71 review)', async () => {
    // The home link redirects into a disallowed path: Exa is not asked for either address.
    const home = stub({
      robots: () => new Response('User-agent: *\nDisallow: /private\n'),
      page: (u) => (u === 'https://jamjam.tech/' ? new Response(null, { status: 301, headers: { location: '/private/home' } }) : html('x', LONG)),
      exa: exaSite([{ url: 'https://jamjam.tech/', title: 'JamJam', text: LONG }]),
    });
    await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    expect(home.some((c) => c.url.startsWith('https://api.exa.ai/'))).toBe(false);
    expect(home.map((c) => c.url)).not.toContain('https://jamjam.tech/private/home');
    // A subpage link that redirects into a disallowed path is not sent; one that redirects within the site is sent
    // at its final address.
    const sub = stub({
      robots: () => new Response('User-agent: *\nDisallow: /private\n'),
      page: (u) => (u === 'https://jamjam.tech/about' ? new Response(null, { status: 301, headers: { location: '/company/about' } })
        : u === 'https://jamjam.tech/team' ? new Response(null, { status: 302, headers: { location: '/private/team' } })
        : new Response('', { status: 200 })),
      exa: exaSite([{ url: 'https://jamjam.tech/', title: 'JamJam', text: LONG }, { url: 'https://jamjam.tech/company/about', title: 'About', text: `About us. ${LONG}` }], 0.009, ['https://jamjam.tech/about', 'https://jamjam.tech/team']),
    });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    const asked = sub.filter((c) => c.url.startsWith('https://api.exa.ai/')).map((c) => c.body as { urls: string[] });
    expect(asked[1].urls).toEqual(['https://jamjam.tech/company/about']);
    expect(JSON.stringify(asked)).not.toContain('/private');
    expect(sub.map((c) => c.url)).not.toContain('https://jamjam.tech/private/team');
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://jamjam.tech/', 'https://jamjam.tech/company/about']);
  });
  it('never asks Exa for a subpage robots.txt disallows, and says so (PR #71 review)', async () => {
    const calls = stub({
      robots: () => new Response('User-agent: *\nDisallow: /private\n'),
      exa: exaSite([{ url: 'https://jamjam.tech/', title: 'JamJam', text: LONG }, { url: 'https://jamjam.tech/private/plan', title: 'Plan', text: `secret ${LONG}` }]),
    });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://jamjam.tech/']);
    expect(r.meta.notes.join(' ')).toMatch(/robots\.txt disallows/);
    expect(JSON.stringify(calls.filter((c) => c.url.startsWith('https://api.exa.ai/')).map((c) => c.body))).not.toContain('/private');
  });
  it('estimates cost from Exa pricing when the reply has no cost', async () => {
    stub({ exa: exaSite([{ url: 'https://a.test/', title: 'A', text: LONG }, { url: 'https://a.test/b', title: 'B', text: `b ${LONG}` }], null) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://a.test/', { website: 'a.test' });
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
    // The link redirects off the site; our own reader follows the redirect, and Exa is asked for where it landed.
    stub({
      page: (u) => (u === 'https://jamjam.tech/go' ? new Response(null, { status: 302, headers: { location: 'https://elsewhere.test/' } }) : html('Elsewhere', LONG)),
      exa: exaSite([{ url: 'https://elsewhere.test/', title: 'Elsewhere', text: LONG }]),
    });
    expect(await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/go', { website: 'jamjam.tech' })).toMatchObject({ ok: true, kind: 'page', trust: 'third_party', url: 'https://elsewhere.test/', meta: { via: 'exa' } });
  });
  it('a path-scoped website on a shared host owns only its own path (PR #63 urlKind)', async () => {
    stub({ exa: exaSite([{ url: 'https://github.com/acme', title: 'acme', text: LONG }, { url: 'https://github.com/acme/brand', title: 'brand', text: `ours ${LONG}` }, { url: 'https://github.com/other', title: 'other', text: `theirs ${LONG}` }]) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://github.com/acme', { website: 'github.com/acme' });
    expect(r).toMatchObject({ ok: true, kind: 'site', trust: 'owned' });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://github.com/acme', 'https://github.com/acme/brand']);
    stub({ page: () => html('Other', LONG) });
    expect(await readSite({}, 'https://github.com/other', { website: 'github.com/acme' })).toMatchObject({ ok: true, kind: 'page', trust: 'third_party' });
    stub({ page: () => html('Docs', LONG) });
    expect(await readSite({}, 'https://docs.github.com/', { website: 'github.com/acme' })).toMatchObject({ ok: true, kind: 'page' });
  });
  it('reads a third-party page on its own, never following links to other tenants of its host (PR #71 review)', async () => {
    const calls = stub({ exa: exaSite([{ url: 'https://github.com/acme', title: 'acme', text: LONG }, { url: 'https://github.com/rival/about', title: 'rival', text: `theirs ${LONG}` }, { url: 'https://github.com/acme/about', title: 'about', text: `ours ${LONG}` }]) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://github.com/acme', { website: 'jamjam.tech' });
    expect(r).toMatchObject({ ok: true, kind: 'page', trust: 'third_party' });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://github.com/acme']);
    expect(calls.filter((c) => c.url.startsWith('https://api.exa.ai/'))).toHaveLength(1);
  });
  it('drops subpages off the website, so one result never mixes owned and third-party text', async () => {
    const calls = stub({ exa: exaSite([{ url: 'https://jamjam.tech/', title: 'JamJam', text: LONG }, { url: 'https://partner.test/jamjam', title: 'Partner', text: `claims ${LONG}` }]) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://jamjam.tech/']);
    // A link off the site is never requested.
    expect(JSON.stringify(calls.map((c) => c.body))).not.toContain('partner.test');
  });
});

describe('site adapter: untrusted Exa output', () => {
  it('skips relative, malformed and non-http page URLs instead of throwing (PR #67 review)', async () => {
    stub({ exa: exaSite([{ url: 'https://a.test/', title: '', text: LONG }], 0.001, ['/about', 'http://[bad', 'javascript:alert(1)', 42, null]) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://a.test/');
    expect(r).toMatchObject({ ok: true, title: 'a.test' });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://a.test/']);
  });
});

describe('site adapter: Exa results are used only for the page they were asked for (PR #71 review)', () => {
  it('does not take a home-page result labelled with another address; the page is read directly', async () => {
    stub({
      exa: () => new Response(JSON.stringify({ results: [{ url: 'https://jamjam.tech/old-launch', title: 'Old launch', text: `Stale launch copy. ${LONG}`, extras: { links: [] } }] })),
      page: () => html('JamJam', `Current home page. ${LONG}`),
    });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/', { website: 'jamjam.tech', subpages: 0 });
    expect(r).toMatchObject({ ok: true, url: 'https://jamjam.tech/', meta: { via: 'fetch' } });
    expect(r.ok && r.text).toContain('Current home page.');
    expect(r.ok && r.text).not.toContain('Stale launch copy.');
  });
  it('files each subpage result under the address it was asked for, and reads a page whose result is for another address itself', async () => {
    stub({
      exa: (_u, init) => {
        const body = JSON.parse(String(init?.body)) as { urls: string[]; extras?: unknown };
        if (body.extras) return new Response(JSON.stringify({ results: [{ url: 'https://jamjam.tech/', title: 'JamJam', text: LONG, extras: { links: ['https://jamjam.tech/about', 'https://jamjam.tech/pricing'] } }] }));
        // Reordered, and the /about entry is a stale copy of a page at another address.
        return new Response(JSON.stringify({ results: [
          { url: 'https://jamjam.tech/pricing', title: 'Pricing', text: `Free plan. ${LONG}` },
          { url: 'https://jamjam.tech/about-us-2019', title: 'About (2019)', text: `Old team page. ${LONG}` },
        ] }));
      },
      page: (u) => (u === 'https://jamjam.tech/about' ? html('About', `Our team today. ${LONG}`) : new Response('', { status: 200 })),
    });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    if (!r.ok || r.kind === 'document') throw new Error('expected a site read');
    const byUrl = Object.fromEntries(r.pages!.map((p) => [p.url, p.text]));
    expect(Object.keys(byUrl).sort()).toEqual(['https://jamjam.tech/', 'https://jamjam.tech/about', 'https://jamjam.tech/pricing']);
    expect(byUrl['https://jamjam.tech/about']).toContain('Our team today.');
    expect(byUrl['https://jamjam.tech/pricing']).toContain('Free plan.');
    expect(r.text).not.toContain('Old team page.');
  });
});

/** A response body of `total` bytes, produced on demand, that records how much of it was read. */
function bigBody(total: number, fill: string, chunk = 64 * 1024) {
  const seen = { pulled: 0, cancelled: false };
  const bytes = new TextEncoder().encode(fill.repeat(Math.ceil(chunk / fill.length)).slice(0, chunk));
  const body = new ReadableStream<Uint8Array>({
    pull(c) {
      if (seen.pulled >= total) return c.close();
      const n = Math.min(chunk, total - seen.pulled);
      seen.pulled += n;
      c.enqueue(bytes.slice(0, n));
    },
    cancel() { seen.cancelled = true; },
  });
  return { body, seen };
}

describe('readers: every response body is read to a bound, then cancelled (PR #71 review)', () => {
  it(`reads at most ${MAX_BYTES} bytes of a page`, async () => {
    const big = bigBody(8 * MAX_BYTES, '<p>JamJam helps brands prove what they say.</p>');
    stub({ page: () => new Response(big.body, { headers: { 'content-type': 'text/html' } }) });
    const p = await readPage('https://a.test/');
    expect(p.text.length).toBeLessThanOrEqual(MAX_BYTES);
    expect(big.seen.pulled).toBeLessThan(MAX_BYTES + 4 * 64 * 1024);
    expect(big.seen.cancelled).toBe(true);
  });
  it('refuses an Exa reply larger than the request allows, without reading it whole, and reads the page directly', async () => {
    const cap = exaReplyCap(1, SITE_DEFAULTS.maxCharacters, 100);
    const big = bigBody(8 * cap, '{"results":[');
    stub({ exa: () => new Response(big.body), page: () => html('JamJam', LONG) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://a.test/', { subpages: 0 });
    expect(r).toMatchObject({ ok: true, meta: { via: 'fetch' } });
    expect(r.meta.notes.join(' ')).toContain('Exa sent a reply larger than the request allows');
    expect(big.seen.pulled).toBeLessThan(cap + 4 * 64 * 1024);
    expect(big.seen.cancelled).toBe(true);
  });
  it('keeps a whole UTF-8 character at the cut, never half of one', async () => {
    // "é" is two bytes; a cap of 3 bytes falls inside the second one.
    const { readText } = await import('../../worker/ingest');
    expect(await readText(new Response('a\u00E9\u00E9'), 4)).toBe('a\u00E9');
    expect(await readText(new Response('\uFEFFhi'))).toBe('hi');
  });
});

describe('readPage: text as a browser shows it (PR #71 review)', () => {
  const read = async (body: string, type = 'text/html') => {
    stub({ page: () => new Response(body, { headers: { 'content-type': type } }) });
    return readPage('https://a.test/', undefined, true);
  };
  it('takes the document title, not an svg icon title, and none from hidden content', async () => {
    expect((await read(`<html><body><svg><title>Menu icon</title></svg><p>${LONG}</p></body></html>`)).title).toBe('a.test');
    expect((await read(`<template><title>Draft</title></template><title>JamJam &amp; friends</title><p>${LONG}</p>`)).title).toBe('JamJam & friends');
  });
  it('keeps text a browser moves out of an unclosed head', async () => {
    expect((await read(`<html><head><meta charset="utf-8"><p>${LONG}`)).text).toBe(LONG);
  });
  it('shows hidden="until-found" content and an open dialog, which a reader can see', async () => {
    const p = await read(`<div hidden="until-found">Found text.</div><dialog open>Open dialog.</dialog><p>${LONG}</p>`);
    expect(p.text).toContain('Found text.');
    expect(p.text).toContain('Open dialog.');
  });
  it('takes a plain-text file as its own text, markup characters and all', async () => {
    const p = await read(`Use <b> for bold &amp; more. ${LONG}`, 'Text/Plain; charset=utf-8');
    expect(p.text).toBe(`Use <b> for bold &amp; more. ${LONG}`);
    expect(p.links).toEqual([]);
  });
});

describe('site adapter: provider replies of the wrong shape (PR #71 review)', () => {
  it('never throws on Exa fields of the wrong type, and returns its typed result', async () => {
    const odd = (body: unknown) => stub({ exa: () => new Response(JSON.stringify(body)), page: () => html('Home', LONG) });
    for (const body of [null, [], { results: 'x' }, { results: [{ url: 'https://a.test/', text: 42, title: {} }] }, { results: [{ url: 'https://a.test/', text: LONG, title: 7, extras: { links: 'https://a.test/b' } }], costDollars: { total: 'free' }, statuses: 'ok' }]) {
      odd(body);
      const r = await readSite({ EXA_API_KEY: 'k' }, 'https://a.test/');
      expect(r.ok).toBe(true);
      if (r.ok) expect(typeof r.title).toBe('string');
    }
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
  it('has no browser-rendering fallback: a script-only page without Exa asks for a paste (PR #71 review)', async () => {
    const calls = stub({ page: () => html('App', '<script>x</script>') });
    const r = await readSite({}, 'https://app.test/');
    expect(r).toMatchObject({ ok: false, code: 'unreadable', reason: expect.stringContaining('Paste the key text') });
    expect(calls.some((c) => c.url.startsWith('https://api.cloudflare.com/'))).toBe(false);
  });
  it('asks for a paste when every path fails, and never throws', async () => {
    stub({ page: () => new Response('nope', { status: 503 }) });
    const r = await readSite({}, 'https://down.test/');
    expect(r).toMatchObject({ ok: false, code: 'unreadable', reason: expect.stringContaining('Paste the key text') });
    expect(r.meta.notes.join(' ')).toMatch(/direct read failed/);
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
    const calls = stub({ robots: () => new Response('User-agent: *\nDisallow: /\n'), exa: exaSite([{ url: 'https://x.test/', title: 'X', text: LONG }]) });
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
      // The apex redirects to www; our own reader follows it before Exa is asked for anything.
      page: (u) => (u === 'https://jamjam.tech/' ? new Response(null, { status: 301, headers: { location: 'https://www.jamjam.tech/' } }) : html('JamJam', LONG)),
      exa: exaSite([{ url: 'https://www.jamjam.tech/', title: 'JamJam', text: LONG }, { url: 'https://www.jamjam.tech/team', title: 'Team', text: `people ${LONG}` }, { url: 'https://www.jamjam.tech/about', title: 'About', text: `about ${LONG}` }]),
    });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    expect(r).toMatchObject({ ok: true, kind: 'site', trust: 'owned', meta: { via: 'exa' } });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://www.jamjam.tech/', 'https://www.jamjam.tech/about']);
    expect(calls.filter((c) => c.url.endsWith('/robots.txt')).map((c) => c.url)).toEqual(['https://jamjam.tech/robots.txt', 'https://www.jamjam.tech/robots.txt']);
  });
  it('never merges two unrelated third-party sites, and refuses a redirect into a disallowed origin', async () => {
    stub({ exa: exaSite([{ url: 'https://news.test/a', title: 'News', text: LONG }, { url: 'https://other.test/b', title: 'Other', text: `x ${LONG}` }]) });
    const r = await readSite({ EXA_API_KEY: 'k' }, 'https://news.test/a', { website: 'jamjam.tech' });
    expect(r.ok && r.pages?.map((p) => p.url)).toEqual(['https://news.test/a']);
    const calls = stub({
      robots: (u) => new Response(u.startsWith('https://blocked.test') ? 'User-agent: *\nDisallow: /\n' : ''),
      page: (u) => (u.startsWith('https://open.test') ? new Response(null, { status: 301, headers: { location: 'https://blocked.test/' } }) : html('B', LONG)),
    });
    const f = await readSite({}, 'https://open.test/go');
    expect(f).toMatchObject({ ok: false, code: 'unreadable' });
    expect(f.meta.notes.join(' ')).toMatch(/robots\.txt does not let us read/);
    // The disallowed destination is never requested (PR #71 review), not merely discarded after download.
    expect(calls.map((c) => c.url)).not.toContain('https://blocked.test/');
  });
  it('follows redirects one hop at a time, checking robots.txt before each fetch (PR #71 review)', async () => {
    const calls = stub({
      robots: (u) => new Response(u.startsWith('https://www.jamjam.tech') ? 'User-agent: *\nDisallow: /private\n' : ''),
      page: (u) => (u === 'https://jamjam.tech/' ? new Response(null, { status: 301, headers: { location: 'https://www.jamjam.tech/' } }) : html('JamJam', LONG)),
    });
    const r = await readSite({}, 'https://jamjam.tech/', { website: 'jamjam.tech' });
    expect(r).toMatchObject({ ok: true, kind: 'site', url: 'https://www.jamjam.tech/', meta: { via: 'fetch' } });
    expect(calls.map((c) => c.url)).toEqual(['https://jamjam.tech/robots.txt', 'https://jamjam.tech/', 'https://www.jamjam.tech/robots.txt', 'https://www.jamjam.tech/']);
    // A relative Location resolves against the current address, and its path is checked too.
    const rel = stub({
      robots: () => new Response('User-agent: *\nDisallow: /private\n'),
      page: (u) => (u === 'https://a.test/go' ? new Response(null, { status: 302, headers: { location: '/private/x' } }) : html('A', LONG)),
    });
    expect(await readSite({}, 'https://a.test/go')).toMatchObject({ ok: false, code: 'unreadable' });
    expect(rel.map((c) => c.url)).not.toContain('https://a.test/private/x');
  });
  it('reads a robots.txt with CR-only line endings (RFC 9309 §2.2; PR #71 review)', async () => {
    expect(allowedBy(parseRobots('User-agent: *\rDisallow: /\r'), '/page')).toBe(false);
    stub({ robots: () => new Response('User-agent: *\rDisallow: /private\r') });
    expect(await readSite({}, 'https://x.test/private/a')).toMatchObject({ ok: false, code: 'robots_disallowed' });
  });
  it('a Sitemap record does not end a group (RFC 9309 §2.2.4; PR #67 review)', () => {
    // JamJamBot and OtherBot share one group: the Sitemap line between their user-agent lines must not split it.
    const rules = parseRobots('User-agent: JamJamBot\nSitemap: https://x.test/s.xml\nUser-agent: OtherBot\nDisallow: /secret\n\nUser-agent: *\nDisallow: /\n');
    expect(allowedBy(rules, '/secret')).toBe(false);
    expect(allowedBy(rules, '/open')).toBe(true);
  });
  it('matches only the whole product token, case-insensitively (RFC 9309 §2.2.1; PR #67 review)', () => {
    const prefix = parseRobots('User-agent: jam\nAllow: /\n\nUser-agent: *\nDisallow: /\n');
    expect(allowedBy(prefix, '/page')).toBe(false);
    expect(allowedBy(parseRobots('User-agent: JAMJAMBOT\nDisallow: /x\n'), '/x')).toBe(false);
    expect(allowedBy(parseRobots('User-agent: JamJamBot/2.0\nDisallow: /x\n'), '/x')).toBe(false);
    // Groups for the same token are combined (§2.2.1 Figure 2); rules before any user-agent line are ignored.
    const merged = parseRobots('Disallow: /early\nUser-agent: jamjambot\nDisallow: /foo\n\nUser-agent: JamJamBot\nDisallow: /baz\n');
    expect([allowedBy(merged, '/foo'), allowedBy(merged, '/baz'), allowedBy(merged, '/early')]).toEqual([false, false, true]);
  });
  it('stops reading robots.txt at the limit instead of buffering the whole body (PR #71 review)', async () => {
    let pulled = 0;
    const chunk = new TextEncoder().encode(`# ${'y'.repeat(16_382)}\n`);
    // An endless body: buffering it all would never finish.
    const body = new ReadableStream<Uint8Array>({ pull(ctl) { pulled += chunk.length; ctl.enqueue(chunk); } });
    const { bytes, truncated } = await readCapped(new Response(body), ROBOTS_MAX_BYTES);
    expect(bytes.length).toBe(ROBOTS_MAX_BYTES);
    expect(truncated).toBe(true);
    expect(pulled).toBeLessThanOrEqual(ROBOTS_MAX_BYTES + 2 * chunk.length);
  });
  it('drops a rule cut off at the 500 KiB cap instead of reading the fragment (PR #71 review)', async () => {
    // "Allow: /public" straddles the cap and would be cut to "Allow: /", which ties "Disallow: /" and allows.
    const head = 'User-agent: *\nDisallow: /\n# ';
    const pad = 'x'.repeat(ROBOTS_MAX_BYTES - head.length - '\nAllow: /'.length);
    stub({ robots: () => new Response(`${head}${pad}\nAllow: /public\n`) });
    expect(await readSite({}, 'https://x.test/private')).toMatchObject({ ok: false, code: 'robots_disallowed' });
    // A file that fits is read whole, last line included.
    const { truncated } = await readCapped(new Response('User-agent: *\nDisallow: /a'), ROBOTS_MAX_BYTES);
    expect(truncated).toBe(false);
  });
  it('reads robots.txt up to 500 KiB in bytes (RFC 9309 §2.5; PR #67 review)', async () => {
    const filler = `# ${'x'.repeat(505_000)}\n`;
    stub({ robots: () => new Response(`User-agent: *\n${filler}Disallow: /late\n`) });
    expect(await readSite({}, 'https://x.test/late')).toMatchObject({ ok: false, code: 'robots_disallowed' });
  });
  it('matches wildcards without regular expressions, in linear time (PR #71 review)', () => {
    const hostile = `/a${'*a'.repeat(400)}*b$`;
    const path = `/${'a'.repeat(20_000)}`;
    const t0 = Date.now();
    expect(ruleMatches(hostile, path)).toBe(false);
    expect(Date.now() - t0).toBeLessThan(200);
    // Semantics unchanged: * spans any run, $ anchors the end, pieces are found in order.
    expect(ruleMatches('/a*b*c', '/axxbyyc/z')).toBe(true);
    expect(ruleMatches('/a*b*c$', '/axxbyyc/z')).toBe(false);
    expect(ruleMatches('/a*bc$', '/abcbc')).toBe(true);
    expect(ruleMatches('/*.pdf$', '/x.pdf')).toBe(true);
    expect(ruleMatches('/ab$', '/ab')).toBe(true);
    expect(ruleMatches('/a*a$', '/a')).toBe(false);
  });
  it('ranks rules by path octets, not counting * or $ (RFC 9309 §2.2.2; PR #71 review)', () => {
    const rules = parseRobots('User-agent: *\nAllow: /foo*$\nDisallow: /foob\n');
    expect(allowedBy(rules, '/foob')).toBe(false);
    expect(allowedBy(parseRobots('User-agent: *\nDisallow: /a*\nAllow: /a\n'), '/a')).toBe(true);
  });
  it('counts a percent-encoded octet once when ranking rules (RFC 9309 §2.2.2; PR #71 review)', () => {
    // ツ is three octets, written %E3%83%84 once normalised: 6 path octets for the Disallow, 9 for the Allow.
    const rules = parseRobots('User-agent: *\nDisallow: /x/ツ*\nAllow: /x/*abcdef\n');
    expect(allowedBy(rules, '/x/ツabcdef')).toBe(true);
  });
  it('keeps every default when an option is passed as undefined (PR #71 review)', async () => {
    const home = `<html><title>A</title><body><p>${LONG}</p><a href="/about">About</a></body></html>`;
    stub({ page: (u) => (u === 'https://a.test/' ? new Response(home, { headers: { 'content-type': 'text/html' } }) : html('About', LONG)) });
    const r = await readSite({}, 'https://a.test/', { website: 'a.test', subpageTarget: undefined, subpages: undefined, maxCharacters: undefined });
    expect(r).toMatchObject({ ok: true, meta: { pages: 2 } });
  });
  it('holds pages read by our own reader to maxCharacters, as Exa pages are (PR #71 review)', async () => {
    const big = LONG.repeat(20);
    const home = `<html><title>A</title><body><p>${big}</p><a href="/about">About</a></body></html>`;
    stub({ page: (u) => (u === 'https://a.test/' ? new Response(home, { headers: { 'content-type': 'text/html' } }) : html('About', big)) });
    const r = await readSite({}, 'https://a.test/', { website: 'a.test', maxCharacters: 300 });
    expect(r).toMatchObject({ ok: true, meta: { pages: 2 } });
    if (!r.ok || r.kind === 'document') throw new Error('expected a site read');
    expect(r.pages!.map((p) => p.text.length)).toEqual([300, 300]);
    expect(r.meta.notes).toContain('2 page(s) cut to 300 characters');
  });
  it('looks past a run of disallowed links to an allowed key page (PR #71 review)', async () => {
    const blocked = Array.from({ length: 14 }, (_, i) => `<a href="/about-private-${i}">About ${i}</a>`).join('');
    const home = `<html><title>A</title><body><nav>${blocked}<a href="/team">Team</a></nav></body></html>`;
    stub({
      robots: () => new Response('User-agent: *\nDisallow: /about-private\n'),
      page: (u) => (u === 'https://a.test/' ? new Response(home, { headers: { 'content-type': 'text/html' } }) : u === 'https://a.test/team' ? html('Team', LONG) : new Response('', { status: 404 })),
    });
    const r = await readSite({}, 'https://a.test/', { website: 'a.test' });
    expect(r).toMatchObject({ ok: true, meta: { pages: 1 } });
    if (!r.ok || r.kind === 'document') throw new Error('expected a site read');
    expect(r.pages!.map((p) => p.url)).toEqual(['https://a.test/team']);
  });
  it('carries a cookie set on a redirect to the next hop of a direct read (PR #71 review)', async () => {
    stub({
      page: (u, init) => {
        if (u === 'https://a.test/old') return new Response(null, { status: 302, headers: [['location', '/new'], ['set-cookie', 'gate=passed; Path=/']] });
        const cookie = (init?.headers as Record<string, string> | undefined)?.cookie;
        return cookie === 'gate=passed' ? html('New', LONG) : new Response('', { status: 403 });
      },
    });
    const r = await readSite({}, 'https://a.test/old', { website: 'a.test', subpages: 0 });
    expect(r).toMatchObject({ ok: true, url: 'https://a.test/new' });
  });
  it(`makes at most ${MAX_SITE_REQUESTS} requests to sites in one read, redirect hops and robots.txt included (PR #71 review)`, async () => {
    const links = Array.from({ length: 30 }, (_, i) => `<a href="/about-${i}">About ${i}</a>`).join('');
    const home = `<html><title>A</title><body><p>${LONG}</p>${links}</body></html>`;
    // Every subpage redirects through a chain of new subdomains, each with its own robots.txt.
    const calls = stub({
      page: (u) => {
        if (u === 'https://a.test/') return new Response(home, { headers: { 'content-type': 'text/html' } });
        const n = Number(/hop(\d+)/.exec(u)?.[1] ?? 0);
        return new Response(null, { status: 302, headers: { location: `https://h${n + 1}.a.test/hop${n + 1}` } });
      },
    });
    await readSite({}, 'https://a.test/', { website: 'a.test' });
    expect(calls.filter((c) => !c.url.startsWith('https://api.exa.ai/')).length).toBeLessThanOrEqual(MAX_SITE_REQUESTS);
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
