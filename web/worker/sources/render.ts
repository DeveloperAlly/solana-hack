import { fetchPage, MAX_BYTES, pageLinks, readable, USER_AGENT, type FetchGate } from '../ingest';

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
 * - Every top-level page load (the first one, a redirect, a meta refresh, a script navigation) is fetched by our own
 *   reader (ingest.ts fetchPage), which checks robots.txt before each hop and identifies as JamJamBot. The browser is
 *   handed that response, so it never fetches a page itself. A redirect is answered as a redirect, which comes back
 *   as a new request and is checked again.
 * - Scripts, stylesheets and data requests go out only after robots.txt for their address allows them, from at most
 *   MAX_ORIGINS origins.
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
  respond(response: { status: number; headers?: Record<string, string>; contentType?: string; body?: string }): Promise<void>;
}
/** The parts of a Puppeteer page this module uses. */
export interface RenderPage {
  setUserAgent(userAgent: string): Promise<void>;
  setBypassServiceWorker(bypass: boolean): Promise<void>;
  evaluateOnNewDocument(script: string): Promise<unknown>;
  setRequestInterception(enabled: boolean): Promise<void>;
  on(event: 'request', handler: (request: InterceptedRequest) => void): unknown;
  mainFrame(): unknown;
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
export interface Renderer {
  /** The page as a browser shows it, or null when it cannot be rendered or robots.txt refuses it. */
  read(url: URL): Promise<RenderedPage | null>;
  /** Pages rendered so far, for the adapter's notes. */
  readonly rendered: number;
  close(): Promise<void>;
}

/** Request types read only to render text. Anything else is refused without a fetch. */
const NEEDED = new Set(['document', 'script', 'stylesheet', 'xhr', 'fetch']);
/** Distinct origins a rendered page may load scripts and data from; each new one costs a robots.txt fetch. */
export const MAX_ORIGINS = 6;
/** How long a page may take to load and settle. Browser Run's free plan allows 60 seconds per browser. */
export const RENDER_TIMEOUT_MS = 15_000;
// https://www.w3.org/TR/CSP3/#directives-fetch: frames, workers and plugins load outside request interception's reach.
export const RENDER_CSP = "frame-src 'none'; child-src 'none'; worker-src 'none'; object-src 'none'";
// Network APIs whose traffic request interception does not see: removed before any page script runs.
const NO_SOCKETS = `(() => { for (const k of ['WebSocket', 'WebTransport', 'RTCPeerConnection', 'webkitRTCPeerConnection']) { try { Object.defineProperty(globalThis, k, { value: undefined, configurable: false, writable: false }); } catch {} } })();`;
// Text as readPage takes it: scripts, styles, navigation and footers left out. Read after the links are taken.
const PAGE_TEXT = `(() => { for (const el of document.querySelectorAll('script,style,noscript,svg,nav,footer,template')) el.remove(); return document.body ? document.body.innerText : ''; })()`;

const tidy = (text: string) => text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();

/**
 * A renderer over one browser session, launched on first use and closed by `close()`. `launch` opens the browser:
 * in the Worker it is `puppeteer.launch(env.BROWSER)` (see `browserRenderer`); tests pass a fake.
 */
export function createRenderer(launch: () => Promise<RenderBrowser>, gate: FetchGate, maxPages: number): Renderer {
  let browser: Promise<RenderBrowser> | null = null;
  let rendered = 0;
  let attempts = 0;

  const read = async (url: URL): Promise<RenderedPage | null> => {
    if (!readable(url) || attempts >= maxPages) return null;
    attempts++;
    let page: RenderPage | null = null;
    try {
      browser ??= launch();
      page = await (await browser).newPage();
      const p = page;
      const origins = new Set<string>();
      await p.setUserAgent(USER_AGENT);
      await p.setBypassServiceWorker(true);
      await p.evaluateOnNewDocument(NO_SOCKETS);
      await p.setRequestInterception(true);
      p.on('request', (req) => {
        if (req.isInterceptResolutionHandled()) return;
        void decide(p, req, origins).catch(() => {
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
  const decide = async (page: RenderPage, req: InterceptedRequest, origins: Set<string>) => {
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
      let fetched: { res: Response; url: URL };
      try {
        fetched = await fetchPage(u, gate);
      } catch {
        return void (await refuse());
      }
      const { res, url: landed } = fetched;
      if (landed.toString() !== u.toString()) {
        await res.body?.cancel().catch(() => undefined);
        // Answered as a redirect: the browser asks for the new address, which comes back here and is checked again.
        return void (req.isInterceptResolutionHandled() || (await req.respond({ status: 302, headers: { location: landed.toString() } })));
      }
      const contentType = res.headers.get('content-type') ?? '';
      if (!/text\/html/.test(contentType)) {
        await res.body?.cancel().catch(() => undefined);
        return void (await refuse());
      }
      const body = (await res.text()).slice(0, MAX_BYTES);
      // The site's own policy stays enforced alongside ours, so nothing its publisher blocks runs here either: a header
      // value is a comma-separated list of policies, and each one applies (CSP3 §2.2 "serialized CSP list", §2.2.2,
      // https://www.w3.org/TR/CSP3/#csp-header) (PR #71 review).
      const own = res.headers.get('content-security-policy');
      const csp = own && own.trim() ? `${own}, ${RENDER_CSP}` : RENDER_CSP;
      return void (req.isInterceptResolutionHandled() || (await req.respond({ status: res.status, contentType, headers: { 'content-security-policy': csp }, body })));
    }
    if (!origins.has(u.origin)) {
      if (origins.size >= MAX_ORIGINS) return void (await refuse());
      origins.add(u.origin);
    }
    if (!(await gate(u))) return void (await refuse());
    if (!req.isInterceptResolutionHandled()) await req.continue();
  };

  return {
    read,
    get rendered() {
      return rendered;
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
