// The loop's shared session state (ADR-012 decisions 1 and 4; issue #90): Brain changes, learn-loop decisions,
// approvals with their fingerprints, and one-tap outcomes. Every loop screen reads it over its fixture defaults, so
// approving a rule on Today or Learn-Rules shows on the Brain, on Post-Detail and back on Today. In memory for the
// browser session only; nothing is persisted and nothing calls the network.
// INTEGRATION: the Brain and proposals come from X18 brand memory and the N5 learn loop (ADR-013, PR #88); approvals
// and sends go to the Worker (POST /api/posts/:id/approve today, web/worker/posts.ts; the rest is not built yet).
import { createBrandScopedStore } from '../../lib/brandScopedStore';
import { activeBrand } from '../brand/activeBrand';
import type { PersonApproval } from '../../domain/approval';
import type { BrainChange, RuleStatus } from '../../domain/brain';
import type { ProposalStatus } from '../../domain/proposal';

export interface RuleChange {
  status: RuleStatus;
  decided: { by: string; at: string };
}

export interface ProposalChange {
  status?: ProposalStatus;
  /** Re-judged against this Brain version. */
  brainVersion?: string;
  decided?: { at: string };
}

export interface LoopState {
  /** Brain version after this session's changes; undefined means the fixture's. */
  brainVersion?: string;
  rules: Record<string, RuleChange>;
  /** Changes made this session, newest first; shown above the fixture history. */
  history: BrainChange[];
  proposals: Record<string, ProposalChange>;
  /** Queue approvals that a later change can make stale, by item id. */
  approvals: Record<string, PersonApproval>;
  /** Irreversible outcomes (sent, paid, rule approved), by item id. */
  outcomes: Record<string, string>;
}

const initial: LoopState = { rules: {}, history: [], proposals: {}, approvals: {}, outcomes: {} };

/**
 * One loop state per brand, on the one active brand (flows/brand): the Brain version, proposals, approvals, history
 * and payouts of one brand never show under another (Codex review on PR 111).
 */
export const loopStore = createBrandScopedStore<LoopState>(activeBrand, initial);

/** Today's date as the canvas writes it ("13 Oct"), for decisions made in the session. */
export const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
