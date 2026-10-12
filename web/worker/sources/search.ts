import { readCapped } from '../ingest';
import { MAX_PAGE_URL } from '../extract/save';
import { factTrust, urlKind } from './registry';
import { clock, type SourceEnv, type SourcePage, type SourceResult } from './types';

/**
 * Web research on the brand and its competitors through Exa (issue #35; backlog B7; Exa is the default search provider
 * behind an adapter, owner 2026-10-06 in STATE.md). Two reads, both third-party (sources/registry.ts):
 * - readSearch: pages about the brand from Exa search (kind search_result). They go through fact extraction like any
 *   source, and every fact from them waits for the owner (never pre-approved; ADR-011, initialReview).
 * - readCompetitors: pages similar to the brand's own site from Exa findSimilar (kind competitor_page), offered as
 *   competitor candidates at the positioning step. They are not facts about the brand, so they never go through brand
 *   fact extraction (intake.ts saves them as candidates).
 *
 * API (https://exa.ai/docs/reference/search, https://exa.ai/docs/reference/find-similar-links): POST with the key in
 * x-api-key and a JSON body; page text comes back when asked for in `contents` (on /search the content options go
 * inside `contents`: https://exa.ai/docs/sdks/quickstart). Exa is used as a cache only (`maxAgeHours: -1`), as in the
 * site adapter (site.ts EXA_CACHE_ONLY): a live crawl would be a request JamJam causes without our robots.txt check,
 * so these reads never make Exa fetch a page. `costDollars.total` in each reply is Exa's own estimate of the request's
 * cost, recorded as meta.cost.
 */
export const EXA_SEARCH = 'https://api.exa.ai/search';
export const EXA_FIND_SIMILAR = 'https://api.exa.ai/findSimilar';
const EXA_CACHE_ONLY = -1;

export const SEARCH_DEFAULTS = {
  /** Results asked for: within the 10 the base price covers (https://exa.ai/pricing). */
  results: 8,
  /** Characters of text kept per result. */
  maxCharacters: 4000,
};
/** Competitor candidates offered at the positioning step (issue #35: "three competitor candidates with sources"). */
export const COMPETITOR_CANDIDATES = 3;
/** Results asked for when looking for competitors: more than three, since the brand's own pages and repeats are dropped. */
export const COMPETITOR_RESULTS = 10;
/** Characters of each competitor page kept: enough for the owner to tell what the company does. */
export const COMPETITOR_CHARS = 1500;
/** Used only when a reply carries no costDollars: /search costs $7 per 1,000 requests up to 10 results (https://exa.ai/pricing). */
export const EXA_SEARCH_PRICE = 0.007;
/** Bytes an Exa reply may take: the text asked for (up to 4 UTF-8 bytes a character, JSON-escaped) plus metadata. */
export const exaSearchCap = (results: number, maxCharacters: number) => 64 * 1024 + results * (maxCharacters * 12 + 16 * 1024);

interface ExaResult { url?: unknown; title?: unknown; text?: unknown }
interface ExaReply { results?: ExaResult[]; costDollars?: { total?: unknown } }

/** One Exa call, its reply streamed and refused past the cap; a failure is a reason for the person, never thrown. */
async function exaPost(endpoint: string, key: string, body: Record<string, unknown>, cap: number): Promise<ExaReply | { error: string }> {
  let res: Response;
  try {
    res = await fetch(endpoint, { method: 'POST', headers: { 'x-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30_000) });
  } catch {
    return { error: 'Exa did not answer in time' };
  }
  // Logging policy: the status only; Exa's message could echo the request.
  if (!res.ok) {
    await res.body?.cancel().catch(() => undefined);
    return { error: `Exa answered HTTP ${res.status}` };
  }
  try {
    const { bytes, truncated } = await readCapped(res, cap);
    if (truncated) return { error: 'Exa sent a reply larger than the request allows' };
    const data = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
    return data && typeof data === 'object' && !Array.isArray(data) ? (data as ExaReply) : { error: 'Exa sent an unreadable reply' };
  } catch {
    return { error: 'Exa sent an unreadable reply' };
  }
}

/** Exa's own cost estimate for the request, or the list price when the reply carries none. */
export function exaCost(reply: ExaReply): { cost: number; estimated: boolean } {
  const total = reply.costDollars?.total;
  return typeof total === 'number' && Number.isFinite(total) && total >= 0 ? { cost: total, estimated: false } : { cost: EXA_SEARCH_PRICE, estimated: true };
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
  for (const r of reply.results ?? []) {
    const host = hostOf(r.url);
    const text = typeof r.text === 'string' ? r.text.replace(/\r\n?/g, '\n').trim() : '';
    const url = r.url as string;
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

/** The brand's domain as a search hint ("jamjam.tech"), or null without a usable website. */
const domainOf = (website: string | null) => hostOf(website && !website.includes('://') ? `https://${website}` : website);

export interface SearchInput { brandName: string; website?: string | null; description?: string | null }

/** Pages about the brand (search_result, third-party). Without EXA_API_KEY: not_configured, with what to do instead. */
export async function readSearch(env: SourceEnv, input: SearchInput): Promise<SourceResult> {
  const c = clock();
  const { trust } = factTrust('search_result');
  const name = (input.brandName ?? '').trim().slice(0, 120);
  const website = input.website?.trim() || null;
  const fail = (code: 'invalid_input' | 'not_configured' | 'unreadable' | 'empty', reason: string, cost = 0) =>
    ({ ok: false as const, kind: 'search_result' as const, code, reason, meta: c.meta(0, cost, 'exa') });
  if (!name) return fail('invalid_input', 'The brand needs a name before we can search the web for it.');
  if (!env.EXA_API_KEY) return fail('not_configured', 'Web search is not set up yet; add links about the brand instead.');
  const domain = domainOf(website);
  // The domain in the query ties results to this brand rather than another with the same name.
  const query = domain ? `${name} (${domain})` : name;
  const reply = await exaPost(EXA_SEARCH, env.EXA_API_KEY, {
    query, type: 'auto', numResults: SEARCH_DEFAULTS.results,
    ...(domain ? { excludeDomains: [domain] } : {}),
    contents: { text: { maxCharacters: SEARCH_DEFAULTS.maxCharacters }, maxAgeHours: EXA_CACHE_ONLY },
  }, exaSearchCap(SEARCH_DEFAULTS.results, SEARCH_DEFAULTS.maxCharacters));
  if ('error' in reply) return fail('unreadable', `${reply.error}; try again later, or add links about the brand instead.`);
  const { cost, estimated } = exaCost(reply);
  if (estimated) c.notes.push('Exa sent no cost; the list price was recorded');
  const pages = resultPages(reply, website, { max: SEARCH_DEFAULTS.results });
  if (!pages.length) return fail('empty', 'The web search found no pages about the brand with text we can read.', cost);
  return { ok: true, kind: 'search_result', trust, title: `Web search: ${name}`, text: joinPages(pages), pages, meta: c.meta(pages.length, cost, 'exa') };
}

/**
 * Competitor candidates (competitor_page, third-party): pages Exa finds similar to the brand's own site, one per host,
 * the brand's own site left out, at most COMPETITOR_CANDIDATES. Without a website there is nothing to compare with,
 * and the owner is told so.
 */
export async function readCompetitors(env: SourceEnv, input: SearchInput): Promise<SourceResult> {
  const c = clock();
  const { trust } = factTrust('competitor_page');
  const website = input.website?.trim() || null;
  const fail = (code: 'invalid_input' | 'not_configured' | 'unreadable' | 'empty', reason: string, cost = 0) =>
    ({ ok: false as const, kind: 'competitor_page' as const, code, reason, meta: c.meta(0, cost, 'exa') });
  const domain = domainOf(website);
  if (!domain) return fail('invalid_input', 'Add the brand\'s website first; competitors are found from it.');
  if (!env.EXA_API_KEY) return fail('not_configured', 'Competitor search is not set up yet; name your alternatives yourself.');
  const reply = await exaPost(EXA_FIND_SIMILAR, env.EXA_API_KEY, {
    url: `https://${domain}`, numResults: COMPETITOR_RESULTS, excludeDomains: [domain],
    contents: { text: { maxCharacters: COMPETITOR_CHARS }, maxAgeHours: EXA_CACHE_ONLY },
  }, exaSearchCap(COMPETITOR_RESULTS, COMPETITOR_CHARS));
  if ('error' in reply) return fail('unreadable', `${reply.error}; try again later, or name your alternatives yourself.`);
  const { cost, estimated } = exaCost(reply);
  if (estimated) c.notes.push('Exa sent no cost; the list price was recorded');
  const pages = resultPages(reply, website, { perHost: true, max: COMPETITOR_CANDIDATES });
  if (!pages.length) return fail('empty', 'No similar companies were found; name your alternatives yourself.', cost);
  return { ok: true, kind: 'competitor_page', trust, title: `Similar to ${domain}`, text: joinPages(pages), pages, meta: c.meta(pages.length, cost, 'exa') };
}
