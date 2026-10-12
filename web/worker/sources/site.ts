import { readPage, resolveRedirects } from '../ingest';
import { factTrust, urlKind } from './registry';
import { fetchRobots, robotsAllows, type RobotsCheck } from './robots';
import { clock, type SourceEnv, type SourcePage, type SourceResult } from './types';

/**
 * Site adapter (issue #33; architecture §6.1 "Source ingestion", accepted 2026-10-12):
 * robots.txt check, then the home page and about 8 key subpages from its links: Exa's cached copies where it has
 * them, otherwise our own reader (ingest.ts readPage), which checks robots.txt before every redirect hop. If nothing
 * can be read, a "paste instead" result. Pure: no database, no model calls, never throws.
 * There is no browser-rendering fallback: a browser follows a page's own client-side navigations (meta refresh,
 * scripts) before anything can check them against robots.txt, so it cannot keep the robots guarantee (PR #71 review).
 * Exa reads script-only sites itself.
 * https://github.com/DeveloperAlly/solana-hack/blob/main/.agentic/what/context/brand_builder_architecture.md#61-component-design-and-evaluation-accepted-2026-10-12
 */
export interface SiteOptions {
  /**
   * The brand's own website (Basics). Pages on it, or on its subdomains, are `site` (owned); any other page is `page`
   * (third-party, facts proposed until the owner approves them). Classified on the final URL after redirects, and per
   * subpage (registry urlKind, from the PR #63 review). With no website set, nothing read here counts as owned.
   */
  website?: string | null;
  /** Key subpages read after the home page, chosen from its links. Architecture §6.1: "about 8 key subpages". */
  subpages?: number;
  /** Terms that rank the home page's links: a link whose path holds an earlier term is read first. */
  subpageTarget?: string[];
  /** Characters of text kept per page (Exa `text.maxCharacters`). */
  maxCharacters?: number;
}
export const SITE_DEFAULTS: Required<Omit<SiteOptions, 'website'>> = {
  subpages: 8,
  subpageTarget: ['about', 'mission', 'product', 'features', 'pricing', 'team', 'docs', 'blog', 'faq', 'customers'],
  maxCharacters: 20_000,
};

// Exa /contents: POST https://api.exa.ai/contents, key in x-api-key; body urls[] (1 to 100), text, extras.links;
// response results[] (url, title, text, extras.links[]), statuses[] and costDollars.total
// (https://exa.ai/docs/reference/get-contents; request type ExtrasOptions { links?: number } in exa-js 2.25.0).
// Exa's own subpage crawl (`subpages`) is not used: it would fetch subpages before their robots.txt could be checked.
// Instead the home page is read with its links, the links are checked against robots.txt here, and only allowed pages
// are requested (PR #71 review).
// Exa is used as a cache only (`maxAgeHours: -1`, "always uses cache" in the same reference): a live crawl would be made
// by Exa under its own crawler identity, whose robots.txt answers and redirects can differ from JamJamBot's, so our
// request never makes Exa fetch anything. A page Exa has not cached is read by our own reader, which checks robots.txt
// before every redirect hop (PR #71 review).
const EXA_CACHE_ONLY = -1;
const EXA_CONTENTS = 'https://api.exa.ai/contents';
// Links asked for on the home page, and at most this many candidates checked against robots.txt (each new origin costs
// one robots.txt fetch, so this bounds the subrequests).
const EXA_LINKS = 100;
const MAX_CANDIDATES = 12;
// Exa pricing: contents cost $1 per 1,000 pages per content type (https://exa.ai/pricing). Used only when the response
// carries no costDollars.
const EXA_PER_PAGE = 0.001;

interface ExaPage { url?: unknown; title?: unknown; text?: unknown; extras?: { links?: unknown } }
interface ExaResponse { results?: ExaPage[]; statuses?: { id?: string; status?: string; error?: { tag?: string; httpStatusCode?: number } }[]; costDollars?: { total?: number } }

/** A provider field as a string, or '' when it is anything else: provider replies are untrusted (PR #71 review). */
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Host without a leading "www.", so an apex-to-www redirect stays on the same site. */
const hostKey = (u: URL) => u.hostname.toLowerCase().replace(/^www\./, '');

/** An absolute http(s) URL as given, never completed or guessed; null for anything else. */
function absoluteUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string') return null;
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}

/** A web address as the adapter reads it: http(s) only, default ports only (same rules as ingest.ts readPage). */
export function siteUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim().includes('://') ? raw.trim() : `https://${raw.trim()}`);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (u.port && u.port !== '80' && u.port !== '443') return null;
    u.hash = '';
    return u;
  } catch {
    return null;
  }
}

async function exaContents(key: string, body: Record<string, unknown>): Promise<ExaResponse | { error: string }> {
  let res: Response;
  try {
    res = await fetch(EXA_CONTENTS, {
      method: 'POST',
      headers: { 'x-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return { error: 'Exa did not answer in time' };
  }
  // Logging policy: the status only; Exa's message could echo the request.
  if (!res.ok) return { error: `Exa answered HTTP ${res.status}` };
  let data: unknown;
  try { data = await res.json(); } catch { return { error: 'Exa sent an unreadable reply' }; }
  return data && typeof data === 'object' && !Array.isArray(data) ? (data as ExaResponse) : { error: 'Exa sent an unreadable reply' };
}

const exaCost = (data: ExaResponse, pages: number) => {
  const total = data.costDollars?.total;
  return typeof total === 'number' && Number.isFinite(total) && total >= 0 ? total : pages * EXA_PER_PAGE;
};

/**
 * Reads the home page and its links with Exa, lets `pick` choose which links may be read (robots.txt, same site,
 * ranking), then reads only those. Provider output is untrusted: only an absolute http(s) URL is used (PR #67 review).
 */
async function viaExa(key: string, url: URL, opts: typeof SITE_DEFAULTS, pick: (links: URL[]) => Promise<URL[]>): Promise<{ pages: SourcePage[]; cost: number; missing: URL[]; linksOk: boolean } | { error: string }> {
  const text = { maxCharacters: opts.maxCharacters };
  const home = await exaContents(key, { urls: [url.toString()], text, extras: { links: EXA_LINKS }, maxAgeHours: EXA_CACHE_ONLY });
  if ('error' in home && typeof home.error === 'string') return { error: home.error };
  const data = home as ExaResponse;
  const results = Array.isArray(data.results) ? data.results : [];
  const top = results[0];
  const failed = Array.isArray(data.statuses) ? data.statuses.find((s) => s?.status === 'error') : undefined;
  if (!str(top?.text).trim()) return { error: failed ? `Exa could not read the page (${str(failed.error?.tag) || 'error'})` : 'Exa returned no text for the page' };
  const seen = new Set<string>();
  const pages: SourcePage[] = [];
  const add = (p: ExaPage) => {
    const body = str(p?.text).trim();
    const u = absoluteUrl(p?.url);
    if (!u || !body || seen.has(u.toString())) return;
    seen.add(u.toString());
    pages.push({ url: u.toString(), title: str(p.title).trim().slice(0, 200) || u.hostname, text: body });
  };
  add(top);
  let cost = exaCost(data, 1);
  const rawLinks = top?.extras?.links;
  // Missing or malformed link metadata is a partial failure: the caller then takes the links from the page itself.
  const linksOk = Array.isArray(rawLinks);
  const links = (linksOk ? (rawLinks as unknown[]) : []).map(absoluteUrl).filter((u): u is URL => !!u);
  const chosen = opts.subpages > 0 ? await pick(links) : [];
  if (chosen.length) {
    const more = await exaContents(key, { urls: chosen.map((u) => u.toString()), text, maxAgeHours: EXA_CACHE_ONLY });
    if (!('error' in more && typeof more.error === 'string')) {
      const extra = more as ExaResponse;
      for (const p of Array.isArray(extra.results) ? extra.results : []) add(p);
      cost += exaCost(extra, chosen.length);
    }
  }
  // Chosen pages Exa has no cached copy of: the caller reads them with its own gated reader.
  const missing = chosen.filter((u) => !seen.has(u.toString()));
  return { pages, cost, missing, linksOk };
}

/** Reads a brand's website: home page plus key subpages. */
export async function readSite(env: SourceEnv, raw: string, options: SiteOptions = {}): Promise<SourceResult> {
  const opts = { ...SITE_DEFAULTS, ...options };
  const c = clock();
  const url = siteUrl(raw);
  const kindOf = (u: string) => urlKind(u, options.website);
  if (!url) return { ok: false, kind: 'page', code: 'invalid_input', reason: 'That is not a web address we can read; use a link that starts with https://.', meta: c.meta(0, 0) };
  const robots = await fetchRobots(url.origin);
  if (!robotsAllows(robots, url)) {
    const reason = robots.state === 'unreachable'
      ? 'We could not read this site\'s robots.txt, so we did not read the site. Paste the key text from your site instead.'
      : 'This site\'s robots.txt asks crawlers not to read this page, so we did not. Paste the key text from your site instead.';
    return { ok: false, kind: kindOf(url.toString()), code: 'robots_disallowed', reason, url: url.toString(), meta: c.meta(0, 0) };
  }
  // robots.txt is read once per origin a page actually comes from: Exa subpages and redirects (apex to www included)
  // can land on another origin, whose own rules apply to it (PR #67 review).
  const robotsByOrigin = new Map<string, Promise<RobotsCheck>>([[url.origin, Promise.resolve(robots)]]);
  const allowedHere = async (u: URL) => {
    if (!robotsByOrigin.has(u.origin)) robotsByOrigin.set(u.origin, fetchRobots(u.origin));
    return robotsAllows(await robotsByOrigin.get(u.origin)!, u);
  };
  // Every page is checked on its own final URL: robots.txt for its origin, then its kind. The first admitted page sets
  // the kind (and so the trust); a later page is kept only if it has the same kind and, for a third-party page, the
  // same host, so one result never mixes owned and third-party text or two unrelated sites. Ownership is never
  // inherited from the address that was asked for.
  const admit = async (all: SourcePage[]) => {
    const kept: SourcePage[] = [];
    let blocked = 0;
    let offsite = 0;
    for (const p of all) {
      const u = siteUrl(p.url);
      if (!u || !(await allowedHere(u))) { blocked++; continue; }
      const first = kept[0] && new URL(kept[0].url);
      if (first && (kindOf(p.url) !== kindOf(kept[0].url) || (kindOf(p.url) === 'page' && hostKey(u) !== hostKey(first)))) { offsite++; continue; }
      kept.push(p);
    }
    if (blocked) c.notes.push(`${blocked} page(s) skipped: robots.txt disallows them`);
    if (offsite) c.notes.push(`${offsite} page(s) skipped: not on the same site as the first page`);
    return kept;
  };
  const ok = (pages: SourcePage[], cost: number, via: string): SourceResult => {
    const kind = kindOf(pages[0].url);
    return { ok: true, kind, trust: factTrust(kind).trust, url: pages[0].url, title: pages[0].title, text: pages.map((p) => p.text).join('\n\n'), pages, meta: c.meta(pages.length, cost, via) };
  };

  // One rule for every address handed to any reader (our own fetch, Exa): its redirects are
  // followed here one hop at a time with robots.txt checked before each hop is fetched (ingest.ts fetchPage), and the
  // fetcher is given the final address, which no longer redirects. null means it cannot be read: a hop is disallowed,
  // or the link cannot be followed (PR #71 review).
  const gated = async (u: URL): Promise<URL | null> => {
    try {
      return await resolveRedirects(u, allowedHere);
    } catch {
      return null;
    }
  };
  const sameSite = (u: URL) => {
    const homeKind = kindOf(url.toString());
    return kindOf(u.toString()) === homeKind && (homeKind === 'site' || hostKey(u) === hostKey(url));
  };
  // The home page's links worth reading: on the same site as the home page, ranked by the key-page terms. Nothing is
  // fetched here.
  const candidatesOf = (links: URL[]): URL[] => {
    // A third-party page is read on its own. Its host can be shared by unrelated tenants (github.com/acme and
    // github.com/rival), so its links are not followed (PR #71 review; registry urlKind path scoping).
    if (kindOf(url.toString()) === 'page') return [];
    const seen = new Set<string>([url.toString()]);
    const candidates: URL[] = [];
    for (const raw of links) {
      const l = siteUrl(raw.toString());
      if (!l || seen.has(l.toString())) continue;
      seen.add(l.toString());
      if (sameSite(l)) candidates.push(l);
    }
    const rank = (u: URL) => {
      const i = opts.subpageTarget.findIndex((t) => u.pathname.toLowerCase().includes(t.toLowerCase()));
      return i === -1 ? opts.subpageTarget.length : i;
    };
    return candidates.map((u, i) => ({ u, i, r: rank(u) })).sort((a, b) => a.r - b.r || a.i - b.i).slice(0, MAX_CANDIDATES).map((x) => x.u);
  };
  // For Exa: the candidates whose every redirect hop robots.txt allows, at their final addresses, checked before any of
  // them is requested (PR #71 review).
  const pick = async (links: URL[]) => {
    const out: URL[] = [];
    const chosen = new Set<string>([url.toString()]);
    let blocked = 0;
    for (const u of candidatesOf(links)) {
      if (out.length >= opts.subpages) break;
      const target = await gated(u);
      // A link that redirects off the site, or to a page already chosen, is not read.
      if (!target) { blocked++; continue; }
      if (!sameSite(target) || chosen.has(target.toString())) continue;
      chosen.add(target.toString());
      out.push(target);
    }
    if (blocked) c.notes.push(`${blocked} linked page(s) not read: robots.txt disallows them, or they could not be followed`);
    return out;
  };

  // Our own reader: robots.txt checked before every redirect hop (ingest.ts fetchPage). null when it cannot be read.
  const readOwn = async (u: URL): Promise<SourcePage | null> => {
    try {
      const p = await readPage(u.toString(), allowedHere);
      return { url: p.url, title: p.title, text: p.text };
    } catch {
      return null;
    }
  };
  // Subpages read by our own reader, from the home page's links, up to the subpage count.
  const readOwnSubpages = async (links: string[], have: Set<string>): Promise<SourcePage[]> => {
    const out: SourcePage[] = [];
    for (const u of candidatesOf(links.map(absoluteUrl).filter((x): x is URL => !!x))) {
      if (out.length >= opts.subpages) break;
      const p = await readOwn(u);
      if (!p || have.has(p.url) || !sameSite(new URL(p.url))) continue;
      have.add(p.url);
      out.push(p);
    }
    return out;
  };

  // 1. Exa, as a cache: the home page with its links, then the chosen key subpages.
  let cost = 0;
  const exaHome = env.EXA_API_KEY ? await gated(url) : null;
  if (env.EXA_API_KEY && !exaHome) c.notes.push('Exa not used: the link redirects to an address robots.txt does not let us read, or could not be followed');
  if (env.EXA_API_KEY && exaHome) {
    const exa = await viaExa(env.EXA_API_KEY, exaHome, opts, pick);
    if ('pages' in exa) {
      cost = exa.cost;
      for (const m of exa.missing) {
        const p = await readOwn(m);
        if (p && !exa.pages.some((x) => x.url === p.url)) exa.pages.push(p);
      }
      // Exa gave the home page without its links: take them from the page with our own reader, then read the key
      // subpages the same way, so a missing field never silently cuts the read to one page (PR #71 review).
      if (!exa.linksOk && opts.subpages > 0) {
        c.notes.push('Exa returned no links for the home page; the key subpages were found with our own reader');
        let ownLinks: string[] = [];
        try {
          ownLinks = (await readPage(url.toString(), allowedHere)).links;
        } catch {
          // the home page cannot be read directly; keep what Exa gave
        }
        exa.pages.push(...(await readOwnSubpages(ownLinks, new Set(exa.pages.map((x) => x.url).concat(url.toString())))));
      }
      const allowed = await admit(exa.pages);
      if (allowed.length) return ok(allowed, cost, 'exa');
    } else {
      c.notes.push(`${exa.error}; read the home page directly instead`);
    }
  } else if (!env.EXA_API_KEY) {
    c.notes.push('Exa is not configured (EXA_API_KEY); the site was read with our own reader');
  }

  // 2. Plain fetch of the home page (the existing reader).
  let fetchError = '';
  try {
    // readPage follows redirects one hop at a time and checks each address's robots.txt before fetching it (ingest.ts
    // fetchPage), so a disallowed destination is never requested (PR #71 review).
    const page = await readPage(url.toString(), allowedHere);
    const pages: SourcePage[] = [{ url: page.url, title: page.title, text: page.text }];
    if (opts.subpages > 0) pages.push(...(await readOwnSubpages(page.links, new Set([page.url, url.toString()]))));
    const kept = await admit(pages);
    if (kept.length) return ok(kept, cost, 'fetch');
    fetchError = 'the page redirected to an address its robots.txt does not let us read';
    c.notes.push(`direct read refused: ${fetchError}`);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'reading the page failed';
    c.notes.push(`direct read failed: ${fetchError}`);
  }

  // 3. Nothing worked: ask for the text instead.
  return { ok: false, kind: kindOf(url.toString()), code: 'unreadable', reason: `We could not read ${url.hostname} (${fetchError}). Paste the key text from your site instead.`, url: url.toString(), meta: c.meta(0, cost) };
}
