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
 * True when a declaration block hides its element: its last display declaration is none, its last visibility
 * declaration is hidden or collapse, or its last content-visibility declaration is hidden (CSS cascade within one
 * block: the later declaration wins). Hiding on visibility
 * alone is the cautious side for this reader: text it cannot be sure is shown does not count as shown.
 */
function hidesElement(declarations: string): boolean {
  let display = false;
  let visibility = false;
  let content = false;
  for (const decl of declarations.split(';')) {
    const i = decl.indexOf(':');
    if (i === -1) continue;
    const prop = decl.slice(0, i).trim().toLowerCase();
    const value = decl.slice(i + 1).replace(/!\s*important\s*$/i, '').trim().toLowerCase();
    if (prop === 'display') display = value === 'none';
    else if (prop === 'visibility') visibility = value === 'hidden' || value === 'collapse';
    // CSS Containment 2: content-visibility: hidden skips the element's contents (https://www.w3.org/TR/css-contain-2/).
    else if (prop === 'content-visibility') content = value === 'hidden';
  }
  return display || visibility || content;
}

/** A compound selector of a tag, classes and an id, all optional but not all absent. */
interface SimpleSelector { tag: string | null; classes: string[]; id: string | null }
const SIMPLE = /^([a-z][a-z0-9-]*)?((?:[.#][a-z_-][\w-]*)*)$/i;
const LEADING_SPACE = /\s*/y;

/** Any declaration that can hide an element, anywhere in a piece of style sheet text. */
const HIDING = /(?:^|[;{\s])(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)|content-visibility\s*:\s*hidden)\s*(?:!\s*important\s*)?(?=;|}|$)/i;
/** A media query list that applies only to print. */
const PRINT_ONLY = /^print$/i;

/**
 * What a page's own style sheet text hides, as far as this reader can tell without a style engine (PR #71 review):
 * - `selectors`: top-level rules whose declarations hide (hidesElement) and whose selector is a simple compound of a
 *   tag, classes and an id, which this reader applies;
 * - `uncertain`: true when some hiding declaration could not be evaluated: inside an at-rule (other than one for print
 *   only), inside a nested rule, or with any other selector. The page's static text then cannot be trusted to be what
 *   a browser shows, and the caller renders the page instead of guessing.
 */
export function hidingSelectors(css: string): { selectors: SimpleSelector[]; uncertain: boolean } {
  const out: SimpleSelector[] = [];
  let uncertain = false;
  const src = css.replace(/\/\*[\s\S]*?\*\//g, ' ');
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf('{', i);
    // An at-rule without a block ("@import ...;") ends at its semicolon.
    LEADING_SPACE.lastIndex = i;
    LEADING_SPACE.exec(src);
    if (src[LEADING_SPACE.lastIndex] === '@') {
      // Searched only up to the next block, so the walk stays linear in the size of the style sheet.
      let semi = -1;
      for (let k = i, stop = open === -1 ? src.length : open; k < stop; k++) if (src[k] === ';') { semi = k; break; }
      if (semi !== -1) { i = semi + 1; continue; }
    }
    if (open === -1) break;
    const prelude = src.slice(i, open).trim();
    // The block, with any nested blocks inside it.
    let depth = 1;
    let j = open + 1;
    for (; j < src.length && depth > 0; j++) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; }
    const block = src.slice(open + 1, j - 1);
    i = j;
    if (prelude.startsWith('@')) {
      const media = /^@media\s+(.*)$/is.exec(prelude);
      if (!(media && PRINT_ONLY.test(media[1].trim())) && HIDING.test(block)) uncertain = true;
      continue;
    }
    if (block.includes('{')) { if (HIDING.test(block)) uncertain = true; continue; }
    if (!hidesElement(block)) continue;
    for (const sel of prelude.split(',')) {
      const m = SIMPLE.exec(sel.trim());
      const parts = m?.[2].match(/[.#][^.#]+/g) ?? [];
      const ids = parts.filter((x) => x[0] === '#').map((x) => x.slice(1));
      if (!m || (!m[1] && !m[2]) || ids.length > 1) { uncertain = true; continue; }
      out.push({ tag: m[1] ? m[1].toLowerCase() : null, classes: parts.filter((x) => x[0] === '.').map((x) => x.slice(1)), id: ids[0] ?? null });
    }
  }
  return { selectors: out, uncertain };
}

const matches = (sel: SimpleSelector, name: string, attribs: Record<string, string>) => {
  if (sel.tag && sel.tag !== name) return false;
  if (sel.id && attribs.id !== sel.id) return false;
  if (!sel.classes.length) return true;
  const classes = (attribs.class ?? '').split(/\s+/);
  return sel.classes.every((c) => classes.includes(c));
};

/**
 * True when an element and everything in it is not shown: a hidden element (above), one of this reader's left-out
 * elements, an element with the hidden attribute (except hidden="until-found", which a reader can find), a dialog that
 * is not open (both in §15.3.1 above), an inline style that hides it, or a rule in the page's own style sheets that
 * hides it (hidingSelectors).
 */
function notText(name: string, attribs: Record<string, string>, hiders: SimpleSelector[]): boolean {
  if (NOT_SHOWN.has(name) || NOT_READ.includes(name)) return true;
  if ('hidden' in attribs && attribs.hidden.trim().toLowerCase() !== 'until-found') return true;
  if (name === 'dialog' && !('open' in attribs)) return true;
  if (typeof attribs.style === 'string' && hidesElement(attribs.style)) return true;
  return hiders.some((sel) => matches(sel, name, attribs));
}

/**
 * The page's own style elements and whether it ships scripts. A style element applies on screen when it is not inside
 * a template (inert) and has no media attribute or one of screen or all; one for print only is ignored; any other
 * (a media query) applies only sometimes, so a hiding declaration in it makes the page's text uncertain. A script
 * runs when it has no type or a JavaScript or module type (HTML standard, "the script element"); data blocks such as
 * JSON-LD do not. External style sheets are not fetched.
 */
function pageStyle(html: string): { css: string; conditional: string; scripts: boolean } {
  let css = '';
  let conditional = '';
  let scripts = false;
  let template = 0;
  let into: 'css' | 'conditional' | null = null;
  const parser = new Parser({
    onopentag(name, attribs) {
      if (name === 'template') template++;
      if (name === 'script') {
        const type = (attribs.type ?? '').trim().toLowerCase();
        if (!type || type === 'module' || /(java|ecma)script/.test(type)) scripts = true;
      }
      if (name !== 'style' || template) return;
      const media = (attribs.media ?? '').trim().toLowerCase();
      into = !media || media === 'screen' || media === 'all' ? 'css' : PRINT_ONLY.test(media) ? null : 'conditional';
    },
    ontext(t) {
      if (into === 'css') css += t;
      else if (into === 'conditional') conditional += t;
    },
    onclosetag(name) {
      if (name === 'template' && template > 0) template--;
      if (name === 'style') { css += '\n'; into = null; }
    },
  });
  parser.write(html);
  parser.end();
  return { css, conditional, scripts };
}

/**
 * An HTML page's title and readable text, read with a real HTML tokenizer (htmlparser2), so nested elements, entities
 * (decoded once: "&amp;lt;" is the text "&lt;") and the raw text of script, style and iframe are handled as a browser
 * does. Content a browser does not show (`notText`) is left out with everything inside it, so a script-only page whose
 * only text sits in a template, a hidden element or one its own inline style sheet hides is seen as having almost no
 * text, and is rendered (PR #71 review). `verified` is false when the page ships scripts and its style sheets hide
 * something this reader could not evaluate (hidingSelectors): its text may not be what a browser shows.
 * The title is the first title element that is not inside such content (an svg icon's title is not the page's).
 */
export function pageText(html: string): { title: string; text: string; verified: boolean } {
  let title: string | null = null;
  let inTitle = false;
  // Depth inside content that is not shown; every element opened there is closed there too (htmlparser2 reports an
  // implied close for void and unclosed elements).
  let hidden = 0;
  let text = '';
  const style = pageStyle(html);
  const sheet = hidingSelectors(style.css);
  const hiders = sheet.selectors;
  // Static text is trusted only when every hiding rule on a scripted page was evaluated (PR #71 review).
  const verified = !style.scripts || (!sheet.uncertain && !HIDING.test(style.conditional));
  const parser = new Parser({
    onopentag(name, attribs) {
      if (hidden) { hidden++; return; }
      if (notText(name, attribs, hiders)) {
        hidden = 1;
        if (name === 'title' && title === null) { title = ''; inTitle = true; }
        return;
      }
      text += name === 'br' ? '\n' : ' ';
    },
    ontext(t) {
      if (inTitle) title += t;
      else if (!hidden) text += t;
    },
    onclosetag(name) {
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
  return { title: tidy(title ?? '').replace(/\n/g, ' '), text: tidy(text), verified };
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
