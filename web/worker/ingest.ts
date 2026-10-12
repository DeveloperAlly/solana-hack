import { Parser } from 'htmlparser2';
import { HttpError } from './env';

export const MAX_BYTES = 1_500_000;

// Named entities that page text commonly carries; numeric ones (decimal and hex) are decoded generically.
const ENTITIES: Record<string, string> = {
  nbsp: ' ', lt: '<', gt: '>', quot: '"', apos: "'", shy: '\u00AD', lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C',
  rdquo: '\u201D', ndash: '\u2013', mdash: '\u2014', hellip: '\u2026', zwj: '\u200D', zwnj: '\u200C',
};
const codePoint = (n: number) => (Number.isInteger(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '');

/** Decodes HTML entities in one pass, so "&amp;lt;" stays the text "&lt;" rather than becoming "<". */
export function decode(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') return codePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) || m;
    if (e.toLowerCase() === 'amp') return '&';
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

export const USER_AGENT = 'JamJamBot/0.1 (+https://jamjam.tech)';
/** At most this many redirects are followed, the same bound the Fetch standard sets: https://fetch.spec.whatwg.org/#http-redirect-fetch */
export const MAX_REDIRECTS = 20;
/** A check run on every address before it is fetched, the first one included; false means do not fetch it. */
export type FetchGate = (url: URL) => Promise<boolean>;

export const readable = (u: URL) => (u.protocol === 'https:' || u.protocol === 'http:') && (!u.port || u.port === '80' || u.port === '443');

/**
 * Fetches a page. With a gate, redirects are followed one hop at a time (redirect: 'manual', supported by Workers:
 * https://developers.cloudflare.com/workers/runtime-apis/request/) and the gate is asked before each fetch, so an
 * address robots.txt disallows is never requested, not merely discarded after download (PR #71 review). Without a gate,
 * the platform follows redirects as before.
 */
export async function fetchPage(url: URL, gate?: FetchGate): Promise<{ res: Response; url: URL }> {
  const init = { signal: AbortSignal.timeout(12000), headers: { 'user-agent': USER_AGENT } };
  if (!gate) {
    try {
      const res = await fetch(url.toString(), { ...init, redirect: 'follow' });
      return { res, url: res.url ? new URL(res.url) : url };
    } catch {
      throw new HttpError(502, 'the site did not answer in time');
    }
  }
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await gate(current))) throw new HttpError(403, 'the link leads to an address its robots.txt does not let us read');
    let res: Response;
    try {
      res = await fetch(current.toString(), { ...init, redirect: 'manual' });
    } catch {
      throw new HttpError(502, 'the site did not answer in time');
    }
    const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
    if (!location) return { res, url: current };
    await res.body?.cancel().catch(() => undefined);
    let next: URL;
    try {
      next = new URL(location, current);
    } catch {
      throw new HttpError(502, 'the site redirected to an address that is not valid');
    }
    if (!readable(next)) throw new HttpError(502, 'the site redirected to an address we cannot read');
    current = next;
  }
  throw new HttpError(502, 'the site redirected too many times');
}

/** Follows a link's redirects with the gate checked before each hop, and returns where it ends; the page is not read. */
export async function resolveRedirects(url: URL, gate: FetchGate): Promise<URL> {
  const { res, url: final } = await fetchPage(url, gate);
  await res.body?.cancel().catch(() => undefined);
  return final;
}

/**
 * The page's own links, absolute http(s), at most 200, read with a real HTML tokenizer (htmlparser2), so quoting,
 * comments, entities and the raw text of script and style are handled as browsers do, not by pattern matching
 * (PR #71 review). Links inside template, noscript and svg are not part of the rendered page and are skipped. Relative
 * links resolve against the document base: the first <base> with an href, resolved against the landed address, when
 * it is http(s); otherwise the landed address (HTML standard, document base URL).
 */
export function pageLinks(html: string, landed: URL): string[] {
  const raw: string[] = [];
  let baseHref: string | null = null;
  let inert = 0;
  const INERT = new Set(['template', 'noscript', 'svg']);
  const parser = new Parser({
    onopentag(name, attribs) {
      if (INERT.has(name)) { inert++; return; }
      if (inert) return;
      if (name === 'base' && baseHref === null && typeof attribs.href === 'string') baseHref = attribs.href;
      // No cap on raw anchors (the body is already capped at MAX_BYTES): the 200 limit applies to cleaned, unique
      // links below, so duplicates and fragment links early on a dense page cannot crowd out later ones (PR #71 review).
      if (name === 'a' && typeof attribs.href === 'string') raw.push(attribs.href);
    },
    onclosetag(name) {
      if (INERT.has(name) && inert > 0) inert--;
    },
  });
  parser.write(html);
  parser.end();
  let base: URL = landed;
  if (baseHref !== null) {
    try {
      const b = new URL((baseHref as string).trim(), landed);
      if (b.protocol === 'https:' || b.protocol === 'http:') base = b;
    } catch {
      // an unusable base is ignored
    }
  }
  const links: string[] = [];
  for (const href of raw) {
    if (links.length >= 200) break;
    const h = href.trim();
    if (!h || h.startsWith('#')) continue;
    try {
      const u = new URL(h, base);
      u.hash = '';
      if ((u.protocol === 'https:' || u.protocol === 'http:') && !links.includes(u.toString())) links.push(u.toString());
    } catch {
      // not a usable address
    }
  }
  return links;
}

/**
 * Fetches one public http(s) page and returns its title, readable text and links. A page with almost no text is
 * refused (422) unless `allowShort` is set, for a caller that still wants the page's links, such as a site reader
 * whose home page is mostly navigation (PR #71 review).
 */
export async function readPage(raw: string, gate?: FetchGate, allowShort = false): Promise<{ url: string; title: string; text: string; links: string[] }> {
  let url: URL;
  try {
    url = new URL(raw.includes('://') ? raw : `https://${raw}`);
  } catch {
    throw new HttpError(400, 'that is not a web address');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new HttpError(400, 'only http and https links can be read');
  if (url.port && url.port !== '80' && url.port !== '443') throw new HttpError(400, 'that link uses an unusual port');
  const { res, url: landed } = await fetchPage(url, gate);
  if (!res.ok) throw new HttpError(502, `the site answered with HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (!/text\/html|text\/plain|markdown/.test(type)) throw new HttpError(415, 'that link is not a web page or text file');
  const body = (await res.text()).slice(0, MAX_BYTES);
  const title = decode((body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? url.hostname).trim()).slice(0, 200);
  const text = decode(
    body
      .replace(/<(script|style|noscript|svg|nav|footer)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|section|article)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
  if (text.length < 40 && !allowShort) throw new HttpError(422, 'that page has almost no readable text');
  // The page's own links (absolute http(s), at most 200), so a reader can choose subpages without another service.
  const links = pageLinks(body, landed);
  return { url: landed.toString(), title, text, links };
}
