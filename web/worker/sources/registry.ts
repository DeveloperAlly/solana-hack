/**
 * Source types and the trust class each one gives its facts (build plan v2 §5, issue #57). One place declares it, so a
 * new source type cannot reach the kit or the claims gate without saying how far its facts are trusted.
 * Kinds follow the source kinds in architecture §3 (site, doc, social, ...):
 * https://github.com/DeveloperAlly/solana-hack/blob/main/.agentic/what/context/brand_builder_architecture.md#3-data-model
 */
export const TRUST = ['owned', 'third_party', 'owner_answer', 'assumption'] as const;
export type Trust = (typeof TRUST)[number];
export const REVIEW = ['proposed', 'approved', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW)[number];

export interface SourceType {
  kind: string;
  /** Trust class of every fact read from this kind of source. */
  trust: Trust;
  /** Shown beside the input that adds this kind of source (for GET /api/source-types, slice 3 #33). */
  label: string;
}

export const SOURCE_TYPES = {
  // The brand's own website: the link the owner adds on the Your links step (ingest in api.ts).
  site: { kind: 'site', trust: 'owned', label: 'Your website or a page you control' },
  // Any other page someone links to: a news article, a profile, a directory listing. The owner does not control it,
  // so its facts wait for the owner's approval (PR #63 review). See urlKind.
  page: { kind: 'page', trust: 'third_party', label: 'A page about the brand that you do not control' },
  // Text the owner pastes (sources/paste.ts, #33): owner-supplied, so owned.
  paste: { kind: 'paste', trust: 'owned', label: 'Text you paste in' },
  // A file the owner uploads, PDF, DOCX or XLSX (sources/document.ts, #33): the brand's own upload, so owned (plan v2 §5).
  document: { kind: 'document', trust: 'owned', label: 'A document you upload (PDF, DOCX, XLSX)' },
  // Planned (#33, #35): no code writes these yet. Declared now so their facts arrive as third-party, never owned.
  search_result: { kind: 'search_result', trust: 'third_party', label: 'A web search result about the brand' },
  competitor_page: { kind: 'competitor_page', trust: 'third_party', label: 'A competitor page' },
} as const satisfies Record<string, SourceType>;
export type SourceKind = keyof typeof SOURCE_TYPES;

/**
 * The review decision a new fact starts with. Facts from the brand's own sources (already quote-checked) and the
 * owner's own answers start approved; third-party facts wait for the owner (plan v2 §5: "a third-party fact enters
 * only after owner approval").
 */
export const initialReview = (trust: Trust): ReviewStatus => (trust === 'third_party' ? 'proposed' : 'approved');

/** The trust and review fields for a fact read from a source of this kind. */
export function factTrust(kind: SourceKind): { trust: Trust; review_status: ReviewStatus } {
  const { trust } = SOURCE_TYPES[kind];
  return { trust, review_status: initialReview(trust) };
}

/**
 * Trust classes of facts the owner can accept or reject (api.ts reviewEvidence): facts read from a source, owned or
 * third-party. An owner answer is changed by editing the answer, and an assumption by redrafting, so neither is
 * reviewable. One definition, read by the review route, the coverage map and the Journey cards (issue #34), so no card
 * offers a decision the route would refuse and no unreviewable row stands in for a question.
 */
export const REVIEWABLE_TRUST: readonly Trust[] = ['owned', 'third_party'];
export const reviewable = (e: { trust?: string | null }) => (REVIEWABLE_TRUST as readonly string[]).includes(e.trust ?? '');

/** Trust classes whose approved facts may enter a kit and back a post. Assumptions never do. */
export const USABLE_TRUST: readonly Trust[] = ['owned', 'owner_answer', 'third_party'];

/**
 * The allow-list (plan v2 §5): approved, and of a usable trust class. Anything else, including a row with no trust
 * or review fields at all (written before migration 009), is left out: unknown means excluded.
 */
export function usableFact(e: { trust?: string | null; review_status?: string | null }): boolean {
  return e.review_status === 'approved' && (USABLE_TRUST as readonly string[]).includes(e.trust ?? '');
}

/** The same allow-list as a PostgREST filter, for reads that filter in the database. */
export const USABLE_FILTER = `review_status=eq.approved&trust=in.(${USABLE_TRUST.join(',')})`;

/**
 * A fact as recorded in a registered kit's evidence snapshot. Kits registered before migration 009 carry only origin,
 * and the old ingest accepted any page, so a legacy `source` fact cannot be shown to come from the brand's own site.
 * It is read exactly as migration 009 backfills live rows: source -> third_party and proposed, so it never backs a
 * post until the brand registers a new, classified kit (PR #63 review). owner_answer stays owner_answer and approved;
 * an assumption, or an unknown origin, stays out. On 2026-10-12 the live database held no kits, so no post is affected:
 * https://github.com/DeveloperAlly/solana-hack/issues/57#issuecomment-6122865718
 */
export function snapshotFact<T extends { origin?: string; trust?: string | null; review_status?: string | null }>(e: T): T & { trust: string | null; review_status: string | null } {
  if (e.trust) return { ...e, trust: e.trust, review_status: e.review_status ?? null };
  if (e.origin === 'source') return { ...e, trust: 'third_party', review_status: 'proposed' };
  if (e.origin === 'owner_answer') return { ...e, trust: 'owner_answer', review_status: 'approved' };
  return { ...e, trust: null, review_status: null };
}

/**
 * Host (without a leading "www.", lower case) and path scope of a URL; null when the value is not a usable URL. The
 * scope is the path with no trailing slash, '' for a site root. A bare domain such as "jamjam.tech" reads as https.
 */
function scope(value: string | null | undefined): { host: string; path: string } | null {
  if (!value) return null;
  try {
    const u = new URL(value.includes('://') ? value : `https://${value}`);
    return { host: u.hostname.toLowerCase().replace(/^www\./, ''), path: u.pathname.replace(/\/+$/, '') };
  } catch {
    return null;
  }
}

/**
 * Which source kind a linked page is. Only a page on the brand's own website is `site`, whose quote-checked facts are
 * owned and approved; any other page is `page`, third-party and proposed until the owner approves each fact. With no
 * website set, nothing counts as owned. Found in review of PR #63: https://github.com/DeveloperAlly/solana-hack/pull/63
 * - A website at a site root (jamjam.tech) owns its host and the host's subdomains (blog.jamjam.tech).
 * - A website with a path (github.com/acme, medium.com/@acme) owns only that path and the pages under it, on that
 *   exact host: a shared host serves other tenants, so github.com/rival and gist.github.com stay third-party. A
 *   brand whose own site is set with a path (acme.com/en) therefore reviews facts from pages outside it; unknown
 *   ownership is reviewed, never assumed.
 * Paths compare case-sensitively, per RFC 3986 §6.2.2.1: https://www.rfc-editor.org/rfc/rfc3986#section-6.2.2.1
 */
export function urlKind(url: string, website: string | null | undefined): 'site' | 'page' {
  const own = scope(website);
  const page = scope(url);
  if (!own || !page) return 'page';
  if (own.path) {
    const under = page.path === own.path || page.path.startsWith(`${own.path}/`);
    return page.host === own.host && under ? 'site' : 'page';
  }
  return page.host === own.host || page.host.endsWith(`.${own.host}`) ? 'site' : 'page';
}
