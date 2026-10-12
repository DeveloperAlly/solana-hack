import { Parser } from 'htmlparser2';
import { Cookie, CookieJar } from 'tough-cookie';
import { HttpError } from './env';

/**
 * Bytes of a page body read at most. The body is streamed and the rest of it cancelled unread at this point, so a large
 * or endless response never fills the Worker's memory (PR #71 review).
 */
export const MAX_BYTES = 1_500_000;

/** Reads at most `max` bytes of a response body, then cancels the rest of the stream. */
export async function readCapped(res: Response, max: number): Promise<{ bytes: Uint8Array; truncated: boolean }> {
  const reader = res.body?.getReader();
  if (!reader) return { bytes: new Uint8Array(0), truncated: false };
  const chunks: Uint8Array[] = [];
  let n = 0;
  let truncated = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const take = Math.min(value.length, max - n);
      if (take > 0) chunks.push(value.subarray(0, take));
      n += take;
      // Any byte past the cap means the body was cut, so its last line may be incomplete.
      if (take < value.length) { truncated = true; break; }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const bytes = new Uint8Array(n);
  let at = 0;
  for (const c of chunks) { bytes.set(c, at); at += c.length; }
  return { bytes, truncated };
}

/**
 * At most `max` bytes of a response body as text, decoded as UTF-8 with a leading BOM dropped, the decoding
 * Response.text() applies (https://fetch.spec.whatwg.org/#dom-body-text), but without reading the whole body first
 * (PR #71 review). A body cut at the cap can end inside a character: stream mode leaves those last bytes out instead
 * of turning them into U+FFFD (https://encoding.spec.whatwg.org/#dom-textdecoder-decode).
 */
export async function readText(res: Response, max = MAX_BYTES): Promise<string> {
  const { bytes, truncated } = await readCapped(res, max);
  return new TextDecoder().decode(bytes, { stream: truncated });
}

/** Whitespace as page text keeps it: runs of spaces and tabs become one space, blank lines are dropped. */
export const tidy = (text: string) => text.replace(/\u00A0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

export const USER_AGENT = 'JamJamBot/0.1 (+https://jamjam.tech)';
/** Links a page gives a reader, at most: the first this many unique http(s) links, by either reader. */
export const MAX_PAGE_LINKS = 200;
/** A link longer than this is not kept: Exa accepts URLs of 1 to 2,048 characters (https://exa.ai/docs/reference/get-contents). */
export const MAX_LINK_LENGTH = 2048;
/** Characters of a page title kept. */
export const MAX_TITLE = 200;
/** At most this many redirects are followed, the same bound the Fetch standard sets: https://fetch.spec.whatwg.org/#http-redirect-fetch */
export const MAX_REDIRECTS = 20;
/**
 * The statuses that are redirects, and only these: 301, 302, 303, 307 and 308 (Fetch standard "redirect status":
 * https://fetch.spec.whatwg.org/#redirect-status). Any other 3xx (300, 304, 305, 306) is a final response, whatever
 * Location it carries (PR #71 review).
 */
export const REDIRECT_STATUSES: ReadonlySet<number> = new Set([301, 302, 303, 307, 308]);
/** The Location a redirect points to, or null when the response is not a redirect or names none. */
export const redirectLocation = (res: Response): string | null => (REDIRECT_STATUSES.has(res.status) ? res.headers.get('location') : null);
/** A check run on every address before it is fetched, the first one included; false means do not fetch it. */
export type FetchGate = (url: URL) => Promise<boolean>;

export const readable = (u: URL) => (u.protocol === 'https:' || u.protocol === 'http:') && (!u.port || u.port === '80' || u.port === '443');

/**
 * One request, redirects not followed (redirect: 'manual'), as JamJamBot, with a timeout. The single place every
 * reader's request goes out from, so identity and limits are the same everywhere.
 */
export async function fetchHop(url: URL, headers: Record<string, string> = {}): Promise<Response> {
  try {
    return await fetch(url.toString(), { signal: AbortSignal.timeout(12000), headers: { ...headers, 'user-agent': USER_AGENT }, redirect: 'manual' });
  } catch {
    throw new HttpError(502, 'the site did not answer in time');
  }
}

/**
 * The network side of one read: every request it makes goes through `hop`, which charges a fixed request budget and
 * keeps cookies the way a browser does (RFC 6265, through tough-cookie's CookieJar:
 * https://github.com/salesforce/tough-cookie), so a cookie a site sets on a redirect or a robots.txt answer is sent on
 * the requests that follow, and no chain of redirects, robots.txt fetches or retries can turn one read into an
 * unbounded number of requests (PR #71 review).
 */
export interface HopSession {
  hop(url: URL, headers?: Record<string, string>): Promise<Response>;
  readonly left: number;
  /** The cookies the session would send to this address, in the shape a browser takes them (Puppeteer CookieParam). */
  cookies(url: URL): Promise<SessionCookie[]>;
  /** Cookies a browser holds for this address, kept so the session's next request to it sends them. */
  remember(url: URL, cookies: SessionCookie[]): Promise<void>;
}
export interface SessionCookie { name: string; value: string; domain?: string; path?: string; secure?: boolean; httpOnly?: boolean }

export function hopSession(maxRequests: number): HopSession {
  const jar = new CookieJar();
  let left = maxRequests;
  return {
    get left() {
      return left;
    },
    async cookies(url) {
      const all = await jar.getCookies(url.toString()).catch(() => [] as Cookie[]);
      // A host-only cookie is given without a domain, so whoever takes it scopes it to the address (RFC 6265 §5.3 step 6).
      return all.map((c) => ({ name: c.key, value: c.value, path: c.path ?? '/', secure: c.secure, httpOnly: c.httpOnly, ...(c.hostOnly || !c.domain ? {} : { domain: c.domain }) }));
    },
    async remember(url, cookies) {
      for (const c of cookies) {
        // A leading dot marks a cookie for the domain and its subdomains; anything else is kept for this host only.
        const domain = c.domain?.startsWith('.') ? c.domain.slice(1) : undefined;
        const cookie = new Cookie({ key: c.name, value: c.value, path: c.path || '/', secure: !!c.secure, httpOnly: !!c.httpOnly, ...(domain ? { domain, hostOnly: false } : {}) });
        await jar.setCookie(cookie, url.toString(), { ignoreError: true }).catch(() => undefined);
      }
    },
    async hop(url, headers = {}) {
      if (left <= 0) throw new HttpError(429, 'this read reached its request limit');
      left--;
      const cookie = await jar.getCookieString(url.toString()).catch(() => '');
      const res = await fetchHop(url, cookie ? { ...headers, cookie } : headers);
      for (const c of res.headers.getSetCookie()) await jar.setCookie(c, url.toString(), { ignoreError: true }).catch(() => undefined);
      return res;
    },
  };
}

/**
 * Fetches a page. With a gate, redirects are followed one hop at a time (redirect: 'manual', supported by Workers:
 * https://developers.cloudflare.com/workers/runtime-apis/request/) and the gate is asked before each fetch, so an
 * address robots.txt disallows is never requested, not merely discarded after download (PR #71 review). Without a gate,
 * the platform follows redirects as before.
 */
export async function fetchPage(url: URL, gate?: FetchGate, session?: HopSession): Promise<{ res: Response; url: URL }> {
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
    const res = session ? await session.hop(current) : await fetchHop(current);
    const location = redirectLocation(res);
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
export async function resolveRedirects(url: URL, gate: FetchGate, session?: HopSession): Promise<URL> {
  const { res, url: final } = await fetchPage(url, gate, session);
  await res.body?.cancel().catch(() => undefined);
  return final;
}

/**
 * The page's own links, absolute http(s), at most MAX_PAGE_LINKS of at most MAX_LINK_LENGTH characters each, read
 * with a real HTML tokenizer (htmlparser2), so quoting,
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
      // No cap on raw anchors (the body is already capped at MAX_BYTES): the link limit applies to cleaned, unique
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
    if (links.length >= MAX_PAGE_LINKS) break;
    const h = href.trim();
    if (!h || h.startsWith('#')) continue;
    try {
      const u = new URL(h, base);
      u.hash = '';
      const link = u.toString();
      if ((u.protocol === 'https:' || u.protocol === 'http:') && link.length <= MAX_LINK_LENGTH && !links.includes(link)) links.push(link);
    } catch {
      // not a usable address
    }
  }
  return links;
}

/**
 * Elements whose content a browser does not show as page text, from the HTML standard's user-agent stylesheet
 * (§15.3.1 "Hidden elements": https://html.spec.whatwg.org/multipage/rendering.html#hidden-elements, noscript included
 * since scripting is on in a browser), plus iframe, whose children are never shown by a browser that supports frames
 * (https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element). `head` is not listed: everything
 * the standard lets it hold is listed or void, and a browser moves anything else in it to the body.
 */
const NOT_SHOWN = new Set(['area', 'base', 'basefont', 'datalist', 'iframe', 'link', 'meta', 'noembed', 'noframes', 'noscript', 'param', 'rp', 'script', 'style', 'template', 'title']);
/** Page furniture this reader leaves out of page text by choice, the same in the plain and the rendered reader. */
export const NOT_READ = ['svg', 'nav', 'footer'];
/** Elements whose closing ends a line of text. */
const LINE_ENDS = new Set(['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article']);

/**
 * Hiding values in style text, found by a token scan with comments stripped: display: none, visibility: hidden or
 * collapse, content-visibility: hidden (CSS Containment 2: https://www.w3.org/TR/css-contain-2/). No cascade and no
 * winning declaration is worked out (PR #71 review): this only says whether the text could hide something.
 */
function hidingPairs(style: string): { prop: string; hides: boolean; important: boolean }[] {
  const out: { prop: string; hides: boolean; important: boolean }[] = [];
  for (const m of style.replace(/\/\*[\s\S]*?\*\//g, ' ').matchAll(/(?:^|[;{\s])(display|visibility|content-visibility)\s*:\s*([^;}!]*)(!\s*important)?/gi)) {
    const prop = m[1].toLowerCase();
    const value = m[2].trim().toLowerCase();
    const hides = prop === 'display' ? value === 'none' : prop === 'visibility' ? value === 'hidden' || value === 'collapse' : value === 'hidden';
    out.push({ prop, hides, important: !!m[3] });
  }
  return out;
}

/**
 * True when an inline style attribute hides its element beyond doubt: every declaration it makes of some hiding
 * property hides, with no showing value for that property to weigh against it. A mixed attribute is not resolved.
 */
function hidesElement(style: string): boolean {
  const pairs = hidingPairs(style);
  return pairs.some((p) => p.hides && pairs.every((q) => q.prop !== p.prop || q.hides));
}
/** True when an inline style attribute could hide its element but not beyond doubt (mixed values, !important). */
const unclearStyle = (style: string) => {
  const pairs = hidingPairs(style);
  return pairs.some((p) => p.hides) && (pairs.some((p) => p.important) || !hidesElement(style));
};

/**
 * True when an element and everything in it is not shown: a hidden element (above), one of this reader's left-out
 * elements, an element with the hidden attribute (except hidden="until-found", which a reader can find), a dialog that
 * is not open (both in §15.3.1 above), or an inline style that hides it beyond doubt. Author style sheets are not
 * applied (PR #71 review): what they hide is known only to a browser (see pageText `verified`).
 */
function notText(name: string, attribs: Record<string, string>): boolean {
  if (NOT_SHOWN.has(name) || NOT_READ.includes(name)) return true;
  if ('hidden' in attribs && attribs.hidden.trim().toLowerCase() !== 'until-found') return true;
  if (name === 'dialog' && !('open' in attribs)) return true;
  return typeof attribs.style === 'string' && hidesElement(attribs.style);
}

/**
 * An HTML page's title and readable text, read with a real HTML tokenizer (htmlparser2), so nested elements, entities
 * (decoded once: "&amp;lt;" is the text "&lt;") and the raw text of script, style and iframe are handled as a browser
 * does. Content a browser does not show (`notText`) is left out with everything inside it, so a script-only page whose
 * only text sits in a template or a hidden element is seen as having almost no text, and is rendered (PR #71 review).
 * `verified` is false when the page ships scripts and its author styles could hide something: its text may not be
 * what a browser shows.
 * The title is the first title element that is not inside such content (an svg icon's title is not the page's).
 */
export function pageText(html: string): { title: string; text: string; verified: boolean } {
  let title: string | null = null;
  let inTitle = false;
  // Depth inside content that is not shown; every element opened there is closed there too (htmlparser2 reports an
  // implied close for void and unclosed elements).
  let hidden = 0;
  let text = '';
  // Whether the page ships scripts (HTML standard, "the script element": no type, or a JavaScript or module type;
  // data blocks such as JSON-LD do not run), and whether its author styles could hide anything: a <style> element
  // with a hiding value, or a style attribute whose hiding is not beyond doubt. On such a page the static text may be
  // a placeholder a browser never shows, so it is unverified, and the caller renders the page or fails closed
  // (PR #71 review). A false positive costs one render, the right way to be wrong.
  let scripts = false;
  let styled = false;
  let inStyle = false;
  let styleText = '';
  let template = 0;
  const parser = new Parser({
    onopentag(name, attribs) {
      if (name === 'template') template++;
      if (name === 'script') {
        const type = (attribs.type ?? '').trim().toLowerCase();
        if (!type || type === 'module' || /(java|ecma)script/.test(type)) scripts = true;
      }
      if (name === 'style' && !template) inStyle = true;
      if (typeof attribs.style === 'string' && unclearStyle(attribs.style)) styled = true;
      if (hidden) { hidden++; return; }
      if (notText(name, attribs)) {
        hidden = 1;
        if (name === 'title' && title === null) { title = ''; inTitle = true; }
        return;
      }
      text += name === 'br' ? '\n' : ' ';
    },
    ontext(t) {
      if (inStyle) styleText += t;
      if (inTitle) title += t;
      else if (!hidden) text += t;
    },
    onclosetag(name) {
      if (name === 'template' && template > 0) template--;
      // A style element is scanned whole, so a value split across text chunks is still seen.
      if (name === 'style' && inStyle) { inStyle = false; if (hidingPairs(styleText).some((p) => p.hides)) styled = true; styleText = ''; }
      if (hidden) {
        hidden--;
        if (!hidden) inTitle = false;
        return;
      }
      text += LINE_ENDS.has(name) ? '\n' : ' ';
    },
  });
  parser.write(html);
  parser.end();
  return { title: tidy(title ?? '').replace(/\n/g, ' '), text: tidy(text), verified: !(scripts && styled) };
}

/**
 * Fetches one public http(s) page and returns its title, readable text and links. A page with almost no text is
 * refused (422) unless `allowShort` is set, for a caller that still wants the page's links, such as a site reader
 * whose home page is mostly navigation (PR #71 review). An HTML page is read as HTML (pageText); a plain-text or
 * Markdown file is its own text, with no title or links of its own.
 */
export async function readPage(raw: string, gate?: FetchGate, allowShort = false, session?: HopSession): Promise<{ url: string; title: string; text: string; links: string[]; verified: boolean }> {
  let url: URL;
  try {
    url = new URL(raw.includes('://') ? raw : `https://${raw}`);
  } catch {
    throw new HttpError(400, 'that is not a web address');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new HttpError(400, 'only http and https links can be read');
  if (url.port && url.port !== '80' && url.port !== '443') throw new HttpError(400, 'that link uses an unusual port');
  const { res, url: landed } = await fetchPage(url, gate, session);
  if (!res.ok) {
    await res.body?.cancel().catch(() => undefined);
    throw new HttpError(502, `the site answered with HTTP ${res.status}`);
  }
  // Media types are case-insensitive (RFC 9110 §8.3.1: https://www.rfc-editor.org/rfc/rfc9110#section-8.3.1).
  const type = res.headers.get('content-type') ?? '';
  const isHtml = /text\/html/i.test(type);
  if (!isHtml && !/text\/plain|markdown/i.test(type)) {
    await res.body?.cancel().catch(() => undefined);
    throw new HttpError(415, 'that link is not a web page or text file');
  }
  const body = await readText(res);
  const page = isHtml ? pageText(body) : { title: '', text: tidy(body), verified: true };
  const title = (page.title || landed.hostname).slice(0, MAX_TITLE);
  if (page.text.length < 40 && !allowShort) throw new HttpError(422, 'that page has almost no readable text');
  // The page's own links (absolute http(s), capped), so a reader can choose subpages without another service.
  const links = isHtml ? pageLinks(body, landed) : [];
  return { url: landed.toString(), title, text: page.text, links, verified: page.verified };
}
