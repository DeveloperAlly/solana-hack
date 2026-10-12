import { pageFromResponse } from '../ingest';
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
  /** Subpages Exa crawls from the home page (Exa `subpages`, 0 to 100). Architecture §6.1: "about 8 key subpages". */
  subpages?: number;
  /** Terms Exa uses to pick which subpages to crawl (Exa `subpageTarget`). */
  subpageTarget?: string[];
  /** Characters of text kept per page (Exa `text.maxCharacters`). */
  maxCharacters?: number;
}
export const SITE_DEFAULTS: Required<Omit<SiteOptions, 'website'>> = {
  subpages: 8,
  subpageTarget: ['about', 'mission', 'product', 'features', 'pricing', 'team', 'docs', 'blog', 'faq', 'customers'],
  maxCharacters: 20_000,
};

// Exa /contents: POST https://api.exa.ai/contents, key in x-api-key; body urls[], text, subpages, subpageTarget;
// response results[] (url, title, text, subpages[]), statuses[] and costDollars.total
// (https://exa.ai/docs/reference/get-contents).
const EXA_CONTENTS = 'https://api.exa.ai/contents';
// Exa pricing: contents cost $1 per 1,000 pages per content type (https://exa.ai/pricing). Used only when the response
// carries no costDollars.
const EXA_PER_PAGE = 0.001;

// Provider replies are untrusted input: every field is checked for its type before use, so an unexpected shape
// becomes a typed failure or a skipped page, never a thrown error (PR #67 review).
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

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

async function viaExa(key: string, url: URL, opts: typeof SITE_DEFAULTS): Promise<{ pages: SourcePage[]; cost: number } | { error: string }> {
  let res: Response;
  try {
    res = await fetch(EXA_CONTENTS, {
      method: 'POST',
      headers: { 'x-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify({ urls: [url.toString()], text: { maxCharacters: opts.maxCharacters }, subpages: opts.subpages, subpageTarget: opts.subpageTarget }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return { error: 'Exa did not answer in time' };
  }
  // Logging policy: the status only; Exa's message could echo the request.
  if (!res.ok) return { error: `Exa answered HTTP ${res.status}` };
  let data: Record<string, unknown> | null;
  try { data = obj(await res.json()); } catch { return { error: 'Exa sent an unreadable reply' }; }
  if (!data) return { error: 'Exa sent an unreadable reply' };
  const top = obj(list(data.results)[0]);
  const failed = list(data.statuses).map(obj).find((st) => st?.status === 'error');
  if (!top || !text(top.text)) return { error: failed ? `Exa could not read the page (${text(obj(failed.error)?.tag) || 'error'})` : 'Exa returned no text for the page' };
  const seen = new Set<string>();
  const pages: SourcePage[] = [];
  for (const p of [top, ...list(top.subpages).map(obj)]) {
    const body = text(p?.text);
    // Only an absolute http(s) URL is used.
    const u = absoluteUrl(p?.url);
    if (!p || !u || !body || seen.has(u.toString())) continue;
    seen.add(u.toString());
    pages.push({ url: u.toString(), title: text(p.title).slice(0, 200) || u.hostname, text: body });
  }
  const total = obj(data.costDollars)?.total;
  const cost = typeof total === 'number' && Number.isFinite(total) && total >= 0 ? total : pages.length * EXA_PER_PAGE;
  return { pages, cost };
}

/** Most redirects followed for one page read: a cap of our own choosing, so a redirect loop ends. */
export const MAX_REDIRECTS = 10;

/**
 * Fetches a page one redirect at a time, checking each destination before it is requested, so a redirect into an
 * address robots.txt disallows is never fetched at all (RFC 9309 §2.2.2: the rules govern access to matching URIs;
 * PR #67 review). Only http(s) on default ports is followed (siteUrl). Never throws.
 */
export async function fetchAllowed(start: URL, allowed: (u: URL) => Promise<boolean>): Promise<{ res: Response; url: URL } | { blocked: URL } | { error: string }> {
  let u = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!(await allowed(u))) return { blocked: u };
    let res: Response;
    try {
      res = await fetch(u.toString(), { redirect: 'manual', signal: AbortSignal.timeout(12_000), headers: { 'user-agent': USER_AGENT } });
    } catch {
      return { error: 'the site did not answer in time' };
    }
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      try { await res.body?.cancel(); } catch { /* nothing to release */ }
      let next: URL | null = null;
      try { next = siteUrl(new URL(location, u).toString()); } catch { next = null; }
      if (!next) return { error: 'the site redirected to an address we cannot read' };
      u = next;
      continue;
    }
    return { res, url: u };
  }
  return { error: `the site redirected more than ${MAX_REDIRECTS} times` };
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
    const data = obj(await res.json());
    const markdown = data?.success === true ? text(data.result) : '';
    const finalUrl = obj(data?.meta)?.finalUrl;
    return markdown.length >= 40 ? { text: markdown, finalUrl: typeof finalUrl === 'string' ? finalUrl : undefined } : { error: 'the rendered page has almost no readable text' };
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

  // 1. Exa: one call for the home page and its key subpages.
  let cost = 0;
  if (env.EXA_API_KEY) {
    const exa = await viaExa(env.EXA_API_KEY, url, opts);
    if ('pages' in exa) {
      cost = exa.cost;
      const allowed = await admit(exa.pages);
      if (allowed.length) return ok(allowed, cost, 'exa');
    } else {
      c.notes.push(`${exa.error}; read the home page directly instead`);
    }
  } else {
    c.notes.push('Exa is not configured (EXA_API_KEY), so only the home page was read');
  }

  // 2. Plain fetch of the home page, following redirects one hop at a time with robots.txt checked before each.
  let fetchError = '';
  let landed = url;
  const got = await fetchAllowed(url, allowedHere);
  if ('blocked' in got) {
    return { ok: false, kind: kindOf(got.blocked.toString()), code: 'robots_disallowed', reason: `This page redirects to ${got.blocked.hostname}, whose robots.txt asks crawlers not to read it, so we did not. Paste the key text from your site instead.`, url: url.toString(), meta: c.meta(0, cost) };
  }
  if ('error' in got) {
    fetchError = got.error;
    c.notes.push(`direct read failed: ${fetchError}`);
  } else {
    landed = got.url;
    try {
      // The same title and text extraction as the existing reader (ingest.ts).
      const page = await pageFromResponse(got.res, got.url);
      const kept = await admit([{ url: page.url, title: page.title, text: page.text }]);
      if (kept.length) return ok(kept, cost, 'fetch');
    } catch (e) {
      fetchError = e instanceof Error ? e.message : 'reading the page failed';
      c.notes.push(`direct read failed: ${fetchError}`);
    }
  }

  // 3. Rendered Markdown, for sites that only show text after their scripts run. It renders the address the plain
  // fetch landed on (already checked hop by hop). Redirects the browser makes itself, by script, are outside our
  // control; their final address is checked again below and the text is dropped if robots.txt disallows it.
  const rendered = await viaRendered(env, landed);
  if ('text' in rendered) {
    const final = absoluteUrl(rendered.finalUrl) ?? landed;
    const kept = await admit([{ url: final.toString(), title: final.hostname, text: rendered.text }]);
    if (kept.length) return ok(kept, cost, 'rendered');
    c.notes.push('rendered page refused: it ended on an address its robots.txt does not let us read');
  } else {
    c.notes.push(rendered.error);
  }

  // 4. Nothing worked: ask for the text instead.
  return { ok: false, kind: kindOf(url.toString()), code: 'unreadable', reason: `We could not read ${url.hostname} (${fetchError}). Paste the key text from your site instead.`, url: url.toString(), meta: c.meta(0, cost) };
}
