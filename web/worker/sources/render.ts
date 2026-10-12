import { fetchHop, NOT_READ, pageLinks, readable, readText, tidy, USER_AGENT, type FetchGate } from '../ingest';

/**
 * Rendered reading for script-only sites (architecture §6.1 "Source ingestion": "fall back to a plain fetch, then
 * Cloudflare's rendered Markdown for script-only sites, then paste"), built so robots.txt is checked before every
 * request the browser makes, not only the first (PR #71 review). The earlier version used the Browser Rendering
 * markdown quick action, which follows a page's meta refresh and script navigations before anything can check them
 * (https://developers.cloudflare.com/api/resources/browser_rendering/subresources/markdown/methods/create/). This one
 * drives the browser through the Workers binding with Puppeteer request interception
 * (https://developers.cloudflare.com/browser-run/puppeteer/; https://pptr.dev/guides/network-interception), where
 * every request stalls until it is continued, answered or aborted, and a redirect is issued as a new request
 * (https://pptr.dev/api/puppeteer.httprequest), so each hop is checked too:
 *
 * - Every top-level page load (the first one, a redirect, a meta refresh, a script navigation) is checked against
 *   robots.txt and fetched one hop at a time by our own reader (ingest.ts fetchHop), as JamJamBot, with the cookies
 *   the browser holds for it. The browser is handed that response, headers included, so it never fetches a page
 *   itself. A redirect is handed over as the redirect it is, cookies and all, and the browser's next request for the
 *   new address comes back here, is checked again and costs another request from the budget (PR #71 review).
 * - Scripts, stylesheets and data requests go out only after robots.txt for their address allows them, from at most
 *   MAX_ORIGINS origins and MAX_REQUESTS requests a page.
 * - Everything not needed for text is refused without a fetch: images, media, fonts, beacons, prefetches, frames.
 * - What request interception cannot see is switched off. The page is served with a Content-Security-Policy that
 *   blocks frames, workers and plugins (https://www.w3.org/TR/CSP3/), service workers are bypassed, and WebSocket,
 *   WebTransport and WebRTC are removed before any page script runs.
 */

/** The parts of a Puppeteer request this module uses (HTTPRequest in @cloudflare/puppeteer). */
export interface InterceptedRequest {
  url(): string;
  resourceType(): string;
  frame(): unknown;
  isInterceptResolutionHandled(): boolean;
  continue(): Promise<void>;
  abort(errorCode?: string): Promise<void>;
  /** A header with several values (Set-Cookie) is sent once per value (headersArray in @cloudflare/puppeteer 1.4.0). */
  respond(response: { status: number; headers?: Record<string, string | string[]>; contentType?: string; body?: string }): Promise<void>;
}
/** The parts of a Puppeteer page this module uses. */
export interface RenderPage {
  setUserAgent(userAgent: string): Promise<void>;
  setBypassServiceWorker(bypass: boolean): Promise<void>;
  evaluateOnNewDocument(script: string): Promise<unknown>;
  setRequestInterception(enabled: boolean): Promise<void>;
  on(event: 'request', handler: (request: InterceptedRequest) => void): unknown;
  mainFrame(): unknown;
  /** Cookies the browser would send to these addresses (Page.cookies in @cloudflare/puppeteer 1.4.0). */
  cookies(...urls: string[]): Promise<{ name: string; value: string }[]>;
  goto(url: string, options: { waitUntil: 'networkidle0'; timeout: number }): Promise<unknown>;
  url(): string;
  title(): Promise<string>;
  content(): Promise<string>;
  evaluate(expression: string): Promise<unknown>;
  close(): Promise<void>;
}
export interface RenderBrowser {
  newPage(): Promise<RenderPage>;
  close(): Promise<void>;
}
export interface RenderedPage { url: string; title: string; text: string; links: string[] }
/**
 * Why no browser could be had, from the launch error (Browser Run limits,
 * https://developers.cloudflare.com/browser-run/limits/): `quota` is "429 Browser time limit exceeded for today", the
 * Workers Free daily allowance of 10 browser minutes, used up until the next UTC day; `rate_limited` is any other 429
 * (too many new or concurrent browsers); `failed` is anything else.
 */
export type RenderUnavailable = 'quota' | 'rate_limited' | 'failed';
export interface Renderer {
  /** The page as a browser shows it, or null when it cannot be rendered or robots.txt refuses it. */
  read(url: URL): Promise<RenderedPage | null>;
  /** Pages rendered so far, for the adapter's notes. */
  readonly rendered: number;
  /** Set when the browser could not be launched; no later read tries again. */
  readonly unavailable: RenderUnavailable | null;
  close(): Promise<void>;
}

/** Classifies a launch error. The binding's error carries `status` and a message of the form "code: 429: message: ...". */
export function launchFailure(e: unknown): RenderUnavailable {
  const status = (e as { status?: unknown } | null)?.status;
  const message = e instanceof Error ? e.message : String(e);
  if (/browser time limit exceeded/i.test(message)) return 'quota';
  return status === 429 || /\bcode:\s*429\b/.test(message) ? 'rate_limited' : 'failed';
}

/** Request types read only to render text. Anything else is refused without a fetch. */
const NEEDED = new Set(['document', 'script', 'stylesheet', 'xhr', 'fetch']);
/** Distinct origins a rendered page may load scripts and data from; each new one costs a robots.txt fetch. */
export const MAX_ORIGINS = 6;
/** Requests one rendered page may cause in all (page loads and the scripts and data let through), whatever its
 * scripts do, so a page that loops on fetch cannot turn one read into thousands of requests (PR #71 review). */
export const MAX_REQUESTS = 150;
// Response headers that describe the transfer rather than the document: the body handed to the browser is already
// decoded and re-measured, so these would be wrong. The CSP is merged below, and Set-Cookie is passed one per value.
const NOT_FORWARDED = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive', 'content-security-policy', 'set-cookie']);
/** How long a page may take to load and settle. Browser Run's free plan allows 60 seconds per browser. */
export const RENDER_TIMEOUT_MS = 15_000;
// https://www.w3.org/TR/CSP3/#directives-fetch: frames, workers and plugins load outside request interception's reach.
export const RENDER_CSP = "frame-src 'none'; child-src 'none'; worker-src 'none'; object-src 'none'";
// Network APIs whose traffic request interception does not see: removed before any page script runs.
const NO_SOCKETS = `(() => { for (const k of ['WebSocket', 'WebTransport', 'RTCPeerConnection', 'webkitRTCPeerConnection']) { try { Object.defineProperty(globalThis, k, { value: undefined, configurable: false, writable: false }); } catch {} } })();`;
/**
 * The text the page shows, as readPage takes it. innerText already leaves out what is not rendered (scripts, styles,
 * templates, hidden elements: https://html.spec.whatwg.org/multipage/dom.html#the-innertext-idl-attribute), so only
 * the furniture readPage leaves out by choice (NOT_READ) is hidden here, with an inline display: none. Nothing is
 * removed: removing a stylesheet would show content it hides (PR #71 review). Run after the links are taken.
 */
export const PAGE_TEXT = `(() => { for (const el of document.querySelectorAll(${JSON.stringify(NOT_READ.join(','))})) el.style.setProperty('display', 'none', 'important'); return document.body ? document.body.innerText : ''; })()`;

/** A response's headers for the browser: transfer headers left out, Set-Cookie once per value. */
function forwarded(res: Response): Record<string, string | string[]> {
  const headers: Record<string, string | string[]> = {};
  res.headers.forEach((value, name) => { if (!NOT_FORWARDED.has(name.toLowerCase())) headers[name.toLowerCase()] = value; });
  const cookies = res.headers.getSetCookie();
  if (cookies.length) headers['set-cookie'] = cookies;
  return headers;
}

/**
 * A renderer over one browser session, launched on first use and closed by `close()`. `launch` opens the browser:
 * in the Worker it is `puppeteer.launch(env.BROWSER)` (see `browserRenderer`); tests pass a fake.
 */
export function createRenderer(launch: () => Promise<RenderBrowser>, gate: FetchGate, maxPages: number): Renderer {
  let browser: Promise<RenderBrowser> | null = null;
  let rendered = 0;
  let attempts = 0;
  let unavailable: RenderUnavailable | null = null;

  const read = async (url: URL): Promise<RenderedPage | null> => {
    if (!readable(url) || attempts >= maxPages) return null;
    attempts++;
    let page: RenderPage | null = null;
    try {
      // One launch per renderer: a refused launch is remembered, so a used-up quota is not asked again per page.
      browser ??= launch().catch((e: unknown) => {
        unavailable = launchFailure(e);
        throw e;
      });
      page = await (await browser).newPage();
      const p = page;
      const origins = new Set<string>();
      const budget = { left: MAX_REQUESTS };
      await p.setUserAgent(USER_AGENT);
      await p.setBypassServiceWorker(true);
      await p.evaluateOnNewDocument(NO_SOCKETS);
      await p.setRequestInterception(true);
      p.on('request', (req) => {
        if (req.isInterceptResolutionHandled()) return;
        void decide(p, req, origins, budget).catch(() => {
          if (!req.isInterceptResolutionHandled()) void req.abort('blockedbyclient').catch(() => undefined);
        });
      });
      try {
        await p.goto(url.toString(), { waitUntil: 'networkidle0', timeout: RENDER_TIMEOUT_MS });
      } catch (e) {
        // A page that never goes quiet is read as it stands; a refused or failed first load is not read at all.
        if (!(e instanceof Error && e.name === 'TimeoutError')) return null;
      }
      const landed = new URL(p.url());
      // The address shown must be one the gate allowed; anything else (an error page) is not read.
      if (!readable(landed) || !(await gate(landed))) return null;
      const html = await p.content();
      const title = (await p.title()).trim().slice(0, 200) || landed.hostname;
      const text = tidy(String((await p.evaluate(PAGE_TEXT)) ?? ''));
      rendered++;
      return { url: landed.toString(), title, text, links: pageLinks(html, landed) };
    } catch {
      return null;
    } finally {
      await page?.close().catch(() => undefined);
    }
  };

  // One decision per request, made once: answer it from our own reader, let it through, or refuse it. Resolution is
  // checked again right before acting, since another handler may have resolved it while this one awaited
  // (https://pptr.dev/guides/network-interception).
  const decide = async (page: RenderPage, req: InterceptedRequest, origins: Set<string>, budget: { left: number }) => {
    const refuse = async () => { if (!req.isInterceptResolutionHandled()) await req.abort('blockedbyclient'); };
    const type = req.resourceType();
    let u: URL;
    try {
      u = new URL(req.url());
    } catch {
      return void (await refuse());
    }
    // Inline content (data: and blob: addresses) involves no request to anyone.
    if (u.protocol === 'data:' || u.protocol === 'blob:') return void (req.isInterceptResolutionHandled() || (await req.continue()));
    if (!readable(u) || !NEEDED.has(type)) return void (await refuse());
    if (type === 'document') {
      // Only the page itself; a frame is refused (and blocked by the CSP as well).
      if (req.frame() !== page.mainFrame()) return void (await refuse());
      if (!(await gate(u))) return void (await refuse());
      if (budget.left <= 0) return void (await refuse());
      budget.left--;
      const jar = await page.cookies(u.toString());
      let res: Response;
      try {
        res = await fetchHop(u, jar.length ? { cookie: jar.map((c) => `${c.name}=${c.value}`).join('; ') } : {});
      } catch {
        return void (await refuse());
      }
      const location = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
      if (location) {
        await res.body?.cancel().catch(() => undefined);
        let next: URL;
        try {
          next = new URL(location, u);
        } catch {
          return void (await refuse());
        }
        if (!readable(next)) return void (await refuse());
        // One hop only: the browser follows it with a new request, which comes back here and is checked again.
        const headers = forwarded(res);
        headers.location = next.toString();
        return void (req.isInterceptResolutionHandled() || (await req.respond({ status: res.status, headers })));
      }
      const contentType = res.headers.get('content-type') ?? '';
      // Media types are case-insensitive (RFC 9110 §8.3.1).
      if (!/text\/html/i.test(contentType)) {
        await res.body?.cancel().catch(() => undefined);
        return void (await refuse());
      }
      // Streamed and cut at MAX_BYTES, the rest cancelled unread, so one navigation cannot fill the Worker's memory
      // (PR #71 review).
      const body = await readText(res);
      // The site's own policy stays enforced alongside ours, so nothing its publisher blocks runs here either: a header
      // value is a comma-separated list of policies, and each one applies (CSP3 §2.2 "serialized CSP list", §2.2.2,
      // https://www.w3.org/TR/CSP3/#csp-header) (PR #71 review).
      const own = res.headers.get('content-security-policy');
      const csp = own && own.trim() ? `${own}, ${RENDER_CSP}` : RENDER_CSP;
      // The page's other headers go with it, cookies included, so the scripts that follow see the state the site set
      // for them, as a visitor's browser would (RFC 6265 §3: https://www.rfc-editor.org/rfc/rfc6265#section-3)
      // (PR #71 review).
      const headers = forwarded(res);
      headers['content-security-policy'] = csp;
      return void (req.isInterceptResolutionHandled() || (await req.respond({ status: res.status, contentType, headers, body })));
    }
    if (!origins.has(u.origin)) {
      if (origins.size >= MAX_ORIGINS) return void (await refuse());
      origins.add(u.origin);
    }
    if (!(await gate(u))) return void (await refuse());
    if (budget.left <= 0) return void (await refuse());
    budget.left--;
    if (!req.isInterceptResolutionHandled()) await req.continue();
  };

  return {
    read,
    get rendered() {
      return rendered;
    },
    get unavailable() {
      return unavailable;
    },
    async close() {
      if (!browser) return;
      await (await browser.catch(() => null))?.close().catch(() => undefined);
    },
  };
}

/** The Workers binding for Browser Run (wrangler.jsonc "browser"). */
export interface BrowserBinding { fetch: typeof fetch }

/** A renderer on the Browser Run binding, with @cloudflare/puppeteer loaded only when a page is first rendered. */
export function browserRenderer(binding: BrowserBinding, gate: FetchGate, maxPages: number): Renderer {
  return createRenderer(async () => {
    const puppeteer = (await import('@cloudflare/puppeteer')).default;
    // The structural types above are the subset of Puppeteer's Browser and Page that this module calls.
    return (await puppeteer.launch(binding)) as unknown as RenderBrowser;
  }, gate, maxPages);
}
