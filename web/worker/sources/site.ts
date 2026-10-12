import { readPage, resolveRedirects } from '../ingest';
import { factTrust, urlKind } from './registry';
import { fetchRobots, robotsAllows, USER_AGENT, type RobotsCheck } from './robots';
import { clock, type SourceEnv, type SourcePage, type SourceResult } from './types';

/**
 * Site adapter (issue #33; architecture §6.1 "Source ingestion", accepted 2026-10-12):
 * robots.txt check, then one Exa /contents call for the home page plus about 8 key subpages, falling back to a plain
 * fetch of the home page (ingest.ts readPage), then Cloudflare's rendered Markdown for script-only sites, then a
 * "paste instead" result. Pure: no database, no model calls, never throws.
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
async function viaExa(key: string, url: URL, opts: typeof SITE_DEFAULTS, pick: (links: URL[]) => Promise<URL[]>): Promise<{ pages: SourcePage[]; cost: number } | { error: string }> {
  const text = { maxCharacters: opts.maxCharacters };
  const home = await exaContents(key, { urls: [url.toString()], text, extras: { links: EXA_LINKS } });
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
  const links = (Array.isArray(rawLinks) ? rawLinks : []).map(absoluteUrl).filter((u): u is URL => !!u);
  const chosen = opts.subpages > 0 ? await pick(links) : [];
  if (chosen.length) {
    const more = await exaContents(key, { urls: chosen.map((u) => u.toString()), text });
    if ('error' in more && typeof more.error === 'string') return { pages, cost };
    const extra = more as ExaResponse;
    for (const p of Array.isArray(extra.results) ? extra.results : []) add(p);
    cost += exaCost(extra, chosen.length);
  }
  return { pages, cost };
}

// Cloudflare Browser Run /markdown renders the page in a browser and returns Markdown: POST
// /accounts/{account_id}/browser-rendering/markdown with {url}, Bearer token with "Browser Run - Edit"; reply
// {success, result} (https://developers.cloudflare.com/api/resources/browser_rendering/subresources/markdown/methods/create/,
// https://developers.cloudflare.com/browser-rendering/rest-api/markdown-endpoint/). The Workers Free plan lists Quick
// Actions limits of 1 request every 10 seconds and 10 browser minutes a day
// (https://developers.cloudflare.com/browser-rendering/limits/), so it is a last resort, used only when configured.
async function viaRendered(env: SourceEnv, url: URL): Promise<{ text: string; finalUrl?: string } | { error: string }> {
  if (!env.CF_ACCOUNT_ID || !env.CF_BROWSER_TOKEN) return { error: 'rendered Markdown is not configured' };
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CF_ACCOUNT_ID)}/browser-rendering/markdown`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.CF_BROWSER_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ url: url.toString(), userAgent: USER_AGENT }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) return { error: res.status === 429 ? 'the page renderer is at its limit for now' : `the page renderer answered HTTP ${res.status}` };
    // meta.finalUrl is the address the browser ended on after redirects (API reference above).
    const data = (await res.json()) as { success?: unknown; result?: unknown; meta?: { finalUrl?: unknown } } | null;
    const text = data?.success === true ? str(data.result).trim() : '';
    return text.length >= 40 ? { text, finalUrl: str(data?.meta?.finalUrl) || undefined } : { error: 'the rendered page has almost no readable text' };
  } catch {
    return { error: 'the page renderer did not answer in time' };
  }
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

  // One rule for every address handed to any fetcher (our own fetch, Exa, the page renderer): its redirects are
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
  // Which of the home page's links to read: on the same site as the home page, ranked by the key-page terms, and only
  // those whose every redirect hop robots.txt allows, checked before any of them is requested (PR #71 review).
  const pick = async (links: URL[]) => {
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
    const ranked = candidates.map((u, i) => ({ u, i, r: rank(u) })).sort((a, b) => a.r - b.r || a.i - b.i).slice(0, MAX_CANDIDATES);
    const out: URL[] = [];
    const chosen = new Set<string>([url.toString()]);
    let blocked = 0;
    for (const { u } of ranked) {
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

  // 1. Exa: the home page with its links, then the chosen key subpages.
  let cost = 0;
  const exaHome = env.EXA_API_KEY ? await gated(url) : null;
  if (env.EXA_API_KEY && !exaHome) c.notes.push('Exa not used: the link redirects to an address robots.txt does not let us read, or could not be followed');
  if (env.EXA_API_KEY && exaHome) {
    const exa = await viaExa(env.EXA_API_KEY, exaHome, opts, pick);
    if ('pages' in exa) {
      cost = exa.cost;
      const allowed = await admit(exa.pages);
      if (allowed.length) return ok(allowed, cost, 'exa');
    } else {
      c.notes.push(`${exa.error}; read the home page directly instead`);
    }
  } else if (!env.EXA_API_KEY) {
    c.notes.push('Exa is not configured (EXA_API_KEY), so only the home page was read');
  }

  // 2. Plain fetch of the home page (the existing reader).
  let fetchError = '';
  try {
    // readPage follows redirects one hop at a time and checks each address's robots.txt before fetching it (ingest.ts
    // fetchPage), so a disallowed destination is never requested (PR #71 review).
    const page = await readPage(url.toString(), allowedHere);
    const kept = await admit([{ url: page.url, title: page.title, text: page.text }]);
    if (kept.length) return ok(kept, cost, 'fetch');
    fetchError = 'the page redirected to an address its robots.txt does not let us read';
    c.notes.push(`direct read refused: ${fetchError}`);
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'reading the page failed';
    c.notes.push(`direct read failed: ${fetchError}`);
  }

  // 3. Rendered Markdown, for sites that only show text after their scripts run. The browser follows HTTP redirects
  // itself, so the link's redirects are resolved here first, hop by hop with robots.txt checked before each fetch, and
  // the browser is given an address that does not redirect (PR #71 review). A navigation the page's own scripts make
  // cannot be checked beforehand; if the browser ends on an address robots.txt disallows, its text is not used.
  let target = url;
  if (env.CF_ACCOUNT_ID && env.CF_BROWSER_TOKEN) {
    const resolved = await gated(url);
    if (!resolved) {
      c.notes.push('rendered read skipped: the link redirects to an address robots.txt does not let us read, or could not be followed');
      return { ok: false, kind: kindOf(url.toString()), code: 'unreadable', reason: `We could not read ${url.hostname} (${fetchError}). Paste the key text from your site instead.`, url: url.toString(), meta: c.meta(0, cost) };
    }
    target = resolved;
  }
  const rendered = await viaRendered(env, target);
  if ('text' in rendered) {
    const final = absoluteUrl(rendered.finalUrl) ?? target;
    const kept = await admit([{ url: final.toString(), title: final.hostname, text: rendered.text }]);
    if (kept.length) return ok(kept, cost, 'rendered');
    c.notes.push('rendered page refused: it ended on an address its robots.txt does not let us read');
  } else {
    c.notes.push(rendered.error);
  }

  // 4. Nothing worked: ask for the text instead.
  return { ok: false, kind: kindOf(url.toString()), code: 'unreadable', reason: `We could not read ${url.hostname} (${fetchError}). Paste the key text from your site instead.`, url: url.toString(), meta: c.meta(0, cost) };
}
