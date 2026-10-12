// Data shapes for the canvas page "Verify + ledger" (issue #49). Screens, hooks and fixtures import from here.
// Sources: wireframe canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn (boards Verify-1-Match to Verify-5-Retracted,
// Ledger) and the backend map (.agentic/what/context/backend_map.md §4, rows "Verify-1, Verify-2, Verify-3" and "Ledger").
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';

/** ISO date-time without a zone ("2026-10-05T16:18"), or null while the canvas brackets it ("[date]"). */
export type IsoDateTime = string | null;

export interface BrandRef {
  id: string;
  name: string;
  /** The brand's domain; shown as "verified" when `domainVerified` (registrations.domain_verified_at_time). */
  domain: string;
  domainVerified: boolean;
}

/** One approved, registered post (table registrations joined to drafts; backend map row "Verify-1, Verify-2, Verify-3"). */
export interface ApprovedPost {
  id: string;
  brand: BrandRef;
  /** The exact approved words. Verify fingerprints the normalised text (web/worker/posts.ts `normalise`). */
  text: string;
  kitVersion: number;
  approver: string;
  approvedAt: IsoDateTime;
  /** Where it was published (registrations.platform_url); `url` is null until the post URL is known. */
  published: { platform: string; at: IsoDateTime; url: string | null } | null;
  /** Ledger label, e.g. "LinkedIn launch post". */
  label: string;
  /** Registration transaction signature; null while the canvas shows "[tx]". */
  signature: string | null;
  /** Phrases the brand's claims gate bans; added text containing one is flagged on Verify-3. */
  bannedPhrases: string[];
  /** Set when the brand retracted the approval (canvas Verify-5; research 10 §7.1 proposal N4). */
  retraction: { at: IsoDateTime; reason: string; signature: string | null } | null;
}

export type DiffKind = 'same' | 'added' | 'removed';
export interface DiffPart { kind: DiffKind; text: string }

/** What a check found. `kind` picks the result view; each view is one component (components/Verify*Result). */
export type VerifyOutcome =
  | { kind: 'match'; post: ApprovedPost }
  | { kind: 'edited'; post: ApprovedPost; similarity: number; diff: DiffPart[]; brokenClaim: string | null }
  | { kind: 'retracted'; post: ApprovedPost }
  | { kind: 'nomatch' };

/** Verify-1/2/3/5 are one screen with different data: the pasted text decides the result (issue #49). */
export interface VerifyCheckData {
  /** The text in the box when the screen opens (the visitor's paste). */
  query: string;
  /** Registered posts the check runs against (POST /api/verify looks these up by hash). */
  posts: ApprovedPost[];
  /** Tag line under the heading (Verify-5 explains retraction). */
  intro?: string;
  /** Canvas "proto" note for a coming-soon screen: what is missing and where it is defined. */
  note?: string;
  /** Plain reason shown in the error state (POST /api/verify `note`, or the request failure). */
  errorNote: string;
}

export type LedgerEntryType = 'kit' | 'post';

/** One ledger row (GET /api/ledger; tables registrations and payouts; backend map row "Ledger"). */
export interface LedgerEntry {
  id: string;
  brandId: string;
  type: LedgerEntryType;
  date: IsoDateTime;
  /** "Kit v1" or the post label. */
  what: string;
  kitVersion: number;
  approver: string;
  /** Kit rows: the kit hash; "[sha256]" while bracketed. */
  hash?: string;
  /** Post rows: the approved text, so "Check it" opens Verify with it. */
  text?: string;
  signature: string | null;
}

export interface LedgerBrand extends BrandRef {
  kitVersion: number;
  verified: boolean;
}

export interface LedgerData {
  brands: LedgerBrand[];
  entries: LedgerEntry[];
  /** Rows per page. */
  pageSize: number;
}

export type LedgerFilter = 'all' | LedgerEntryType;
export type LedgerSort = 'newest' | 'oldest';

export type LookupKind = 'account' | 'kit' | 'claim';

/** A registered account, kit version or claim (GET /api/verify/{account,kit,claim}). */
export interface LookupRecord {
  kind: LookupKind;
  /** What the visitor types: an account handle or link, a kit hash, or the claim text. */
  key: string;
  brandName: string;
  /** Result headline, e.g. "Official account of JamJam". */
  title: string;
  registeredAt: IsoDateTime;
  signature: string | null;
}

export interface VerifyLookupData {
  initialTab: LookupKind | 'post';
  /** Starting text per lookup tab. */
  queries: Record<LookupKind, string>;
  records: LookupRecord[];
  note: string;
  errorNote: string;
}

/** Every screen takes its data plus the demo state from the gallery switcher (C28). */
export interface ScreenProps<D> {
  data: D;
  state?: ScreenState;
}
