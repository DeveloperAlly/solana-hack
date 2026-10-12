// Today's one approval queue: a union by kind (ADR-012 decision 1, PR #86; contract table in issue #90, row "Today":
// draft, reply, ambassador post, event content, learned rule, campaign decision, with one { blocking, label } gate).
// Each kind maps to the ADR-013 module that produces it: draft and reply (Create, on X18 brand memory), ambassador
// post (Grow; a quest submission when it carries a questId, paid through domain/quest.ts), event content (Grow, the event source registry: plan items are ordinary drafts),
// learned rule (N5 learn loop), campaign decision (Grow, campaign optimiser).
import type { ArtboardName } from '../config/artboards';
import type { Gate } from './approval';
import { proposalGate, type Proposal } from './proposal';
import type { PostChecks } from './post';
import { submissionGate, type Quest } from './quest';

interface QueueBase {
  id: string;
  /** Chip text: "Draft · X", "Event · 5 days". */
  chip: string;
  /** The item itself: a quoted draft or a one-line summary. */
  text: string;
  /** The line under it: voice, kit, checks, wait time. */
  meta: string;
  /** The secondary action, a link to where the item is worked on (Edit, Review, Open plan, Decide). */
  open: { label: string; artboard: ArtboardName };
}

export interface DraftItem extends QueueBase { kind: 'draft'; checks: PostChecks; whyThis?: ArtboardName }
export interface ReplyItem extends QueueBase { kind: 'reply'; checks: PostChecks }
/** An ambassador post with a payout; `questId` marks a quest submission, whose payout also needs the quest's gate (domain/quest.ts). */
export interface AmbassadorPostItem extends QueueBase { kind: 'ambassadorPost'; payout: { amount: number; unit: 'USDC' }; verified: boolean; disclosure: 'present' | 'missing'; questId?: string }
export interface EventContentItem extends QueueBase { kind: 'eventContent'; drafts: number }
export interface LearnedRuleItem extends QueueBase { kind: 'learnedRule'; proposalId: string }
export interface CampaignDecisionItem extends QueueBase { kind: 'campaignDecision'; capShare: number }

export type QueueItem = DraftItem | ReplyItem | AmbassadorPostItem | EventContentItem | LearnedRuleItem | CampaignDecisionItem;
export type QueueKind = QueueItem['kind'];

/** Today's filter, in the canvas order. Campaign decisions show under Everything only, as the canvas draws it. */
export const queueFilters: { value: 'all' | QueueKind; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'draft', label: 'Drafts' },
  { value: 'reply', label: 'Replies' },
  { value: 'ambassadorPost', label: 'Ambassador posts' },
  { value: 'eventContent', label: 'Event content' },
  { value: 'learnedRule', label: 'Learned rules' },
];

/** The one-tap action on an item and what it leaves behind; kinds without one are decided on their own screen. */
export const primaryActions: Record<QueueKind, { label: string; done: string; reversible: boolean } | undefined> = {
  draft: { label: 'Approve', done: 'Approved. It publishes on its schedule.', reversible: true },
  reply: { label: 'Send', done: 'Sent.', reversible: false },
  ambassadorPost: { label: 'Approve and pay', done: 'Approved. The USDC payout is queued.', reversible: false },
  learnedRule: { label: 'Approve rule', done: 'Approved. The rule is active in the Brain.', reversible: false },
  eventContent: undefined,
  campaignDecision: undefined,
};

/** What a gate reads besides the item: the current Brain version and the learn loop's proposals. */
export interface GateContext {
  brainVersion: string;
  proposal: (id: string) => Proposal | undefined;
  /** The full quest, with this session's payouts counted, for quest submissions (domain/quest.ts submissionGate). */
  quest?: (id: string) => Quest | undefined;
}

/** The no-AI-slop pass and the claims gate: the core product gates (issue #45). */
export function checksGate(c: PostChecks): Gate {
  if (c.slop === 'failed') return { blocking: true, label: 'Failed the no-AI-slop pass. Edit it to approve.' };
  const missing = c.claims.total - c.claims.backed;
  if (missing > 0) return { blocking: true, label: `${missing} ${missing === 1 ? 'claim needs' : 'claims need'} a source. Add one to approve.` };
  if (c.disclosure === 'missing') return { blocking: true, label: 'Disclosure missing. Add it to approve.' };
  return { blocking: false, label: `Slop check passed · claims backed (${c.claims.backed} of ${c.claims.total})` };
}

/** A paid post (ambassador or quest): verified against the kit, with its disclosure. */
function paidPostGate(i: AmbassadorPostItem): Gate {
  if (!i.verified) return { blocking: true, label: 'Not verified against your kit yet.' };
  if (i.disclosure === 'missing') return { blocking: true, label: 'Disclosure missing. Ask them to add it.' };
  return { blocking: false, label: `Verified against your kit · disclosure present · ${i.payout.amount} ${i.payout.unit} on approval` };
}

const opensElsewhere: Gate = { blocking: false, label: 'Decided on its own screen.' };

/** One gate per kind. Badges and the primary action both read it, so a blocked badge never sits by an open button. */
const gates: { [K in QueueKind]: (item: Extract<QueueItem, { kind: K }>, ctx: GateContext) => Gate } = {
  draft: (i) => checksGate(i.checks),
  reply: (i) => checksGate(i.checks),
  // A quest submission (any item carrying a questId) also passes the quest gate: found, its reward, a free slot.
  ambassadorPost: (i, ctx) => (i.questId ? submissionGate(paidPostGate(i), i, ctx.quest?.(i.questId)) : paidPostGate(i)),
  learnedRule: (i, ctx) => {
    const p = ctx.proposal(i.proposalId);
    return p ? proposalGate(p, ctx.brainVersion) : { blocking: true, label: 'Proposal not found.' };
  },
  eventContent: () => opensElsewhere,
  campaignDecision: () => opensElsewhere,
};

export function gateFor(item: QueueItem, ctx: GateContext): Gate {
  return (gates[item.kind] as (i: QueueItem, c: GateContext) => Gate)(item, ctx);
}
