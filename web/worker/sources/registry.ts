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
 * A fact as recorded in a registered kit's evidence snapshot. Kits registered before migration 009 carry only origin;
 * every such entry passed the old filter (assumptions excluded), so it maps exactly as migration 009 backfills live
 * rows: source -> owned, owner_answer -> owner_answer, both approved. An assumption, or an unknown origin, stays out.
 */
export function snapshotFact<T extends { origin?: string; trust?: string | null; review_status?: string | null }>(e: T): T & { trust: string | null; review_status: string | null } {
  if (e.trust) return { ...e, trust: e.trust, review_status: e.review_status ?? null };
  const trust = e.origin === 'source' ? 'owned' : e.origin === 'owner_answer' ? 'owner_answer' : null;
  return { ...e, trust, review_status: trust ? 'approved' : null };
}

/** Hostname without a leading "www.", lower case; null when the value is not a usable URL. */
function host(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Which source kind a linked page is. Only a page on the brand's own website (the Basics website, or one of its
 * subdomains) is `site`, whose quote-checked facts are owned and approved; any other page is `page`, third-party and
 * proposed until the owner approves each fact. With no website set, nothing counts as owned. Found in review of
 * PR #63: https://github.com/DeveloperAlly/solana-hack/pull/63
 */
export function urlKind(url: string, website: string | null | undefined): 'site' | 'page' {
  const own = host(website);
  const h = host(url);
  return own && h && (h === own || h.endsWith(`.${own}`)) ? 'site' : 'page';
}
