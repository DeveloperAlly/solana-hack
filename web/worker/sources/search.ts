import { readCapped } from '../ingest';
import { MAX_PAGE_URL } from '../extract/save';
import { factTrust, urlKind } from './registry';
import { clock, type SourceEnv, type SourcePage, type SourceResult } from './types';

/**
 * Web research on the brand and its competitors through Exa (issue #35; backlog B7; Exa is the default search provider
 * behind an adapter, owner 2026-10-06 in STATE.md). Two reads, both third-party (sources/registry.ts):
 * - readSearch: pages about the brand from Exa search (kind search_result). They go through fact extraction like any
 *   source, and every fact from them waits for the owner (never pre-approved; ADR-011, initialReview).
 * - readCompetitors: pages similar to the brand's own site, also from Exa search (kind competitor_page), offered as
 *   competitor candidates at the positioning step. They are not facts about the brand, so they never go through brand
 *   fact extraction (intake.ts saves them as candidates).
 *
 * Both reads use /search only. Exa's URL-similarity endpoint (/findSimilar) is deprecated in Exa's own SDKs: exa-js
 * 2.25.0 marks findSimilar "@deprecated Use `search()` for new discovery flows. This legacy URL-similarity method will
 * be removed in a future version" (https://www.npmjs.com/package/exa-js, dist/index.d.ts), and exa-py 2.25.0 gives the
 * migration "Use search("pages similar to " + url) instead of find_similar(url)" (https://pypi.org/project/exa-py/,
 * exa_py/api.py find_similar). Exa's pricing page lists no price for it (https://exa.ai/docs/admin/pricing).
 *
 * API (https://exa.ai/docs/reference/search, OpenAPI SearchRequest): POST with the key in x-api-key and a JSON body
 * of `query`, `type`, `numResults`, `excludeDomains` and `contents`; page text comes back when asked for in
 * `contents.text` (ContentsOptions). Exa is used as a cache only (`contents.maxAgeHours: -1`, "always uses cache"), as
 * in the site adapter (site.ts EXA_CACHE_ONLY): a live crawl would be a request JamJam causes without our robots.txt
 * check, so these reads never make Exa fetch a page. `costDollars.total` in each reply is Exa's own estimate of the
 * request's cost, recorded as meta.cost.
 */
export const EXA_SEARCH = 'https://api.exa.ai/search';
const EXA_CACHE_ONLY = -1;

export const SEARCH_DEFAULTS = {
  /** Results asked for: within the 10 the base price covers (https://exa.ai/pricing). */
  results: 8,
  /** Characters of text kept per result. */
  maxCharacters: 4000,
};
/** Competitor candidates offered at the positioning step (issue #35: "three competitor candidates with sources"). */
export const COMPETITOR_CANDIDATES = 3;
/**
 * Results asked for when looking for competitors: more than three, since the brand's own pages and repeats are dropped,
 * and no more than the 10 results the /search base price covers (https://exa.ai/docs/admin/pricing).
 */
export const COMPETITOR_RESULTS = 10;
/** Characters of each competitor page kept: enough for the owner to tell what the company does. */
export const COMPETITOR_CHARS = 1500;
/**
 * Used only when a /search reply carries no costDollars: type auto costs $7 per 1,000 requests up to 10 results
 * (https://exa.ai/docs/admin/pricing). Every Exa call here is a /search of type auto with at most 10 results and no
 * summaries, so this list price covers each of them.
 */
export const EXA_SEARCH_PRICE = 0.007;
/** Bytes an Exa reply may take: the text asked for (up to 4 UTF-8 bytes a character, JSON-escaped) plus metadata. */
export const exaSearchCap = (results: number, maxCharacters: number) => 64 * 1024 + results * (maxCharacters * 12 + 16 * 1024);

interface ExaResult { url: string; title?: string | null; text?: string }
interface ExaReply { results: ExaResult[]; costDollars?: { total?: unknown } }

/**
 * The reply checked whole at the boundary, before anything reads it (Codex review on PR #100), in the shape the
 * reference documents (https://exa.ai/docs/reference/search, SearchResponse): an
 * object whose `results` is an array of objects, each with a string `url`, a string or null `title`, a string `text`
 * when present, and `costDollars` an object when present. Fields this adapter does not read are allowed (Exa adds them
 * over time). Anything else is null: the read then fails as `unreadable` (4xx, so the run does not retry it).
 * Hand-written, like the other external-JSON checks in this Worker (site.ts exaByAddress, llm.ts).
 */
export function parseExaReply(data: unknown): ExaReply | null {
  const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  if (!isObj(data) || !Array.isArray(data.results)) return null;
  if (data.costDollars !== undefined && !isObj(data.costDollars)) return null;
  for (const r of data.results) {
    if (!isObj(r) || typeof r.url !== 'string') return null;
    if (r.title !== undefined && r.title !== null && typeof r.title !== 'string') return null;
    if (r.text !== undefined && typeof r.text !== 'string') return null;
  }
  return data as unknown as ExaReply;
}

/**
 * The /search request fields this adapter sends, each one documented in Exa's OpenAPI SearchRequest
 * (https://exa.ai/docs/reference/search): `type` auto (the default, priced at EXA_SEARCH_PRICE), `numResults` within
 * the 10 the base price covers, `excludeDomains` entries that are a hostname or a hostname with a path prefix, and
 * `contents` (ContentsOptions) with `text.maxCharacters` and `maxAgeHours`. Typed so no other field can be sent.
 */
interface ExaSearchBody {
  query: string;
  type: 'auto';
  numResults: number;
  excludeDomains?: string[];
  contents: { text: { maxCharacters: number }; maxAgeHours: typeof EXA_CACHE_ONLY };
}

/** Why an Exa call failed, classified where it happened: `retry` when the same call may pass later. */
export interface ExaFailure { error: string; retry: boolean }

/** The longest Retry-After waited out inside the step; a longer one is left to the runner's own backoff. */
export const EXA_RETRY_AFTER_MAX_MS = 10_000;

/**
 * Retry-After as milliseconds: delay-seconds or an HTTP-date (RFC 9110 §10.2.3,
 * https://www.rfc-editor.org/rfc/rfc9110#section-10.2.3); null when absent or unreadable.
 */
export function retryAfterMs(value: string | null, now = Date.now()): number | null {
  if (!value) return null;
  const v = value.trim();
  if (/^\d+$/.test(v)) return Number(v) * 1000;
  const at = Date.parse(v);
  return Number.isNaN(at) ? null : Math.max(0, at - now);
}

/**
 * One Exa call, its reply streamed and refused past the cap. A failure is returned, never thrown, and classified as
 * Exa's error-code reference says to treat it (https://exa.ai/docs/admin/error-codes, Codex review on PR #100):
 * - retryable: no answer or a broken connection, 429 (rate or concurrency limit), and any 5xx (500 internal, 503
 *   SERVICE_OVERLOADED: "retry with exponential backoff"). A 429 is retried once here after its Retry-After ("wait
 *   for Retry-After seconds when present") when that is at most EXA_RETRY_AFTER_MAX_MS; otherwise the runner retries.
 * - not retryable: any other 4xx (a bad request or key will fail again), a reply over the cap, and a 2xx reply that is
 *   not JSON or not in the documented shape (parseExaReply).
 */
async function exaSearch(key: string, body: ExaSearchBody, cap: number, waited = false): Promise<ExaReply | ExaFailure> {
  let res: Response;
  try {
    res = await fetch(EXA_SEARCH, { method: 'POST', headers: { 'x-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) });
  } catch {
    return { error: 'Exa did not answer in time', retry: true };
  }
  // Logging policy: the status only; Exa's message could echo the request.
  if (!res.ok) {
    await res.body?.cancel().catch(() => undefined);
    if (res.status === 429 && !waited) {
      const wait = retryAfterMs(res.headers.get('retry-after'));
      if (wait !== null && wait <= EXA_RETRY_AFTER_MAX_MS) {
        await new Promise((r) => setTimeout(r, wait));
        return exaSearch(key, body, cap, true);
      }
    }
    return { error: `Exa answered HTTP ${res.status}`, retry: res.status === 429 || res.status >= 500 };
  }
  let bytes: Uint8Array;
  try {
    const read = await readCapped(res, cap);
    if (read.truncated) return { error: 'Exa sent a reply larger than the request allows', retry: false };
    bytes = read.bytes;
  } catch {
    return { error: 'the connection to Exa broke while its reply was read', retry: true };
  }
  let data: unknown;
  try {
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return { error: 'Exa sent a reply that is not JSON', retry: false };
  }
  return parseExaReply(data) ?? { error: 'Exa sent a reply in an unexpected shape', retry: false };
}

/**
 * Exa's own cost estimate for the request (`costDollars.total`); when the reply carries none, the published /search
 * list price (EXA_SEARCH_PRICE), with a note saying so.
 */
export function exaCost(reply: ExaReply): { cost: number; note?: string } {
  const total = reply.costDollars?.total;
  if (typeof total === 'number' && Number.isFinite(total) && total >= 0) return { cost: total };
  return { cost: EXA_SEARCH_PRICE, note: 'Exa sent no cost; the list price was recorded' };
}

/** Host of a URL without a leading "www.", lower case; null when it is not an absolute http(s) URL. */
export function hostOf(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.hostname.toLowerCase().replace(/^www\./, '') : null;
  } catch {
    return null;
  }
}

/**
 * Results as pages: an absolute http(s) URL, some text, not on the brand's own website (those are owned pages the site
 * adapter reads, with robots.txt checked; urlKind in registry.ts), each URL once. `perHost` keeps one page per host.
 */
export function resultPages(reply: ExaReply, website: string | null, opts: { perHost?: boolean; max: number }): SourcePage[] {
  const pages: SourcePage[] = [];
  const seen = new Set<string>();
  for (const r of reply.results) {
    const host = hostOf(r.url);
    const text = (r.text ?? '').replace(/\r\n?/g, '\n').trim();
    const url = r.url;
    // An address too long to store whole (spec/db/011 evidence_page_url_check, the sitemaps limit) is left out, never
    // cut: a cut address is another page.
    if (!host || !text || url.length > MAX_PAGE_URL) continue;
    if (website && urlKind(url, website) === 'site') continue;
    const key = opts.perHost ? host : url;
    if (seen.has(key)) continue;
    seen.add(key);
    const title = (typeof r.title === 'string' && r.title.trim() ? r.title.trim() : host).slice(0, 200);
    pages.push({ url, title, text });
    if (pages.length >= opts.max) break;
  }
  return pages;
}

/**
 * The pages' text joined in order, as the site adapter joins a site's pages (site.ts), so engine/readers.ts readSource
 * finds every page's offsets in it and each fact links to the page it is on (extract/save.ts pageOf).
 */
export const joinPages = (pages: SourcePage[]) => pages.map((p) => p.text).join('\n\n');

/** The brand's website as an absolute URL (a bare "jamjam.tech" reads as https), or null without a usable one. */
function siteOf(website: string | null): URL | null {
  if (!website) return null;
  try {
    const u = new URL(website.includes('://') ? website : `https://${website}`);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}
/**
 * What the brand owns on the web, as Exa's include/exclude filters take it: the host, plus the path for a website set
 * with one (github.com/acme), so a shared host's other tenants are not excluded (the same scope as urlKind in
 * registry.ts; Exa accepts "a hostname with a path prefix": https://exa.ai/docs/reference/search, excludeDomains).
 */
export function ownScope(website: string | null): string | null {
  const u = siteOf(website);
  if (!u) return null;
  const path = u.pathname.replace(/\/+$/, '');
  return `${u.hostname.toLowerCase().replace(/^www\./, '')}${path}`;
}

export interface SearchInput { brandName: string; website?: string | null; description?: string | null }

/** Pages about the brand (search_result, third-party). Without EXA_API_KEY: not_configured, with what to do instead. */
export async function readSearch(env: SourceEnv, input: SearchInput): Promise<SourceResult> {
  const c = clock();
  const { trust } = factTrust('search_result');
  const name = (input.brandName ?? '').trim().slice(0, 120);
  const website = input.website?.trim() || null;
  const fail = (code: 'invalid_input' | 'not_configured' | 'unreadable' | 'unavailable' | 'empty', reason: string, cost = 0) =>
    ({ ok: false as const, kind: 'search_result' as const, code, reason, meta: c.meta(0, cost, 'exa') });
  if (!name) return fail('invalid_input', 'The brand needs a name before we can search the web for it.');
  if (!env.EXA_API_KEY) return fail('not_configured', 'Web search is not set up yet; add links about the brand instead.');
  const scope = ownScope(website);
  // The website in the query ties results to this brand rather than another with the same name.
  const query = scope ? `${name} (${scope})` : name;
  const reply = await exaSearch(env.EXA_API_KEY, {
    query, type: 'auto', numResults: SEARCH_DEFAULTS.results,
    ...(scope ? { excludeDomains: [scope] } : {}),
    contents: { text: { maxCharacters: SEARCH_DEFAULTS.maxCharacters }, maxAgeHours: EXA_CACHE_ONLY },
  }, exaSearchCap(SEARCH_DEFAULTS.results, SEARCH_DEFAULTS.maxCharacters));
  if ('error' in reply) return fail(reply.retry ? 'unavailable' : 'unreadable', `${reply.error}; try again later, or add links about the brand instead.`);
  const { cost, note } = exaCost(reply);
  if (note) c.notes.push(note);
  const pages = resultPages(reply, website, { max: SEARCH_DEFAULTS.results });
  if (!pages.length) return fail('empty', 'The web search found no pages about the brand with text we can read.', cost);
  return { ok: true, kind: 'search_result', trust, title: `Web search: ${name}`, text: joinPages(pages), pages, meta: c.meta(pages.length, cost, 'exa') };
}

/**
 * The brand's website as the address in a "pages similar to" query: scheme, host and path only. User name, password,
 * query and fragment are dropped, so nothing but the public address of the site is sent to Exa.
 */
export function similarTarget(site: URL): string {
  const u = new URL(site.toString());
  u.username = '';
  u.password = '';
  u.search = '';
  u.hash = '';
  return u.toString();
}

/**
 * Competitor candidates (competitor_page, third-party): pages Exa search finds similar to the brand's own site, one per
 * host, the brand's own site left out, at most COMPETITOR_CANDIDATES. The query is the form Exa gives as the
 * replacement for its deprecated findSimilar, "pages similar to " + url (exa-py 2.25.0 find_similar,
 * https://pypi.org/project/exa-py/). Without a website there is nothing to compare with, and the owner is told so.
 */
export async function readCompetitors(env: SourceEnv, input: SearchInput): Promise<SourceResult> {
  const c = clock();
  const { trust } = factTrust('competitor_page');
  const website = input.website?.trim() || null;
  const fail = (code: 'invalid_input' | 'not_configured' | 'unreadable' | 'unavailable' | 'empty', reason: string, cost = 0) =>
    ({ ok: false as const, kind: 'competitor_page' as const, code, reason, meta: c.meta(0, cost, 'exa') });
  const site = siteOf(website);
  if (!site) return fail('invalid_input', 'Add the brand\'s website first; competitors are found from it.');
  if (!env.EXA_API_KEY) return fail('not_configured', 'Competitor search is not set up yet; name your alternatives yourself.');
  const scope = ownScope(website)!;
  // Similar to the website itself, with its path: a brand at github.com/acme is compared with acme, not with GitHub.
  const reply = await exaSearch(env.EXA_API_KEY, {
    query: `pages similar to ${similarTarget(site)}`, type: 'auto', numResults: COMPETITOR_RESULTS, excludeDomains: [scope],
    contents: { text: { maxCharacters: COMPETITOR_CHARS }, maxAgeHours: EXA_CACHE_ONLY },
  }, exaSearchCap(COMPETITOR_RESULTS, COMPETITOR_CHARS));
  if ('error' in reply) return fail(reply.retry ? 'unavailable' : 'unreadable', `${reply.error}; try again later, or name your alternatives yourself.`);
  const { cost, note } = exaCost(reply);
  if (note) c.notes.push(note);
  const pages = resultPages(reply, website, { perHost: true, max: COMPETITOR_CANDIDATES });
  if (!pages.length) return fail('empty', 'No similar companies were found; name your alternatives yourself.', cost);
  return { ok: true, kind: 'competitor_page', trust, title: `Similar to ${scope}`, text: joinPages(pages), pages, meta: c.meta(pages.length, cost, 'exa') };
}
