// Quests: paid community tasks in USDC (canvas v24 board Quests, COMING SOON; component inventory D53 QuestCard).
// A quest is a one-off paid task; an ambassador seat is ongoing. Submissions are checked by the same no-AI-slop pass and
// claims gate as the brand's own posts, carry the disclosure, and go to the one approval queue (domain/queue.ts) as
// ambassador posts with a payout, tagged with their questId: no second queue. Quests and Today share the one gate
// (queue.ts gateFor, which applies submissionGate) and the one action, approveSubmission. Rewards go to the doer's own wallet (backend map). No paid posting
// on X (pitch deck "Why now").
import type { Gate } from '../lib/approval';

export const questFormats = [
  { id: 'tutorial', label: 'Tutorial or article' },
  { id: 'video', label: 'Video' },
  { id: 'answers', label: 'Community answers' },
  { id: 'recap', label: 'Event recap' },
] as const;
export type QuestFormat = (typeof questFormats)[number]['id'];
export const isQuestFormat = (v: string): v is QuestFormat => questFormats.some((f) => f.id === v);
export const formatLabel = (f: QuestFormat): string => questFormats.find((x) => x.id === f)!.label;

/** D53 states: announced but not open yet, open, submissions waiting, paid out (every slot paid, budget reached). */
export type QuestState = 'coming-soon' | 'open' | 'submitted' | 'paid';

export interface Quest {
  id: string;
  task: string;
  format: QuestFormat;
  /** USDC per completion. */
  rewardUsdc: number;
  slots: number;
  /** Completions paid so far. */
  paid: number;
  /** "Fri 24 Oct", or null for ongoing. */
  due: string | null;
  /** Set while the quest is announced but not open ("Opens Mon 3 Nov"). */
  opens: string | null;
}

export const budgetCap = (rewardUsdc: number, slots: number): number => Math.round(rewardUsdc * slots * 100) / 100;

/** A quest's state, given how many of its submissions still wait for a decision. */
export function questState(q: Quest, waiting: number): QuestState {
  if (q.opens) return 'coming-soon';
  // Every slot paid closes the quest, even with submissions still waiting: none of them can be paid.
  if (q.paid >= q.slots) return 'paid';
  return waiting > 0 ? 'submitted' : 'open';
}

export interface QuestDraft {
  task: string;
  format: string;
  /** As typed: "50" or "12.50". */
  reward: string;
  /** As typed: a whole number. */
  slots: string;
  /** "2026-10-24", or empty for ongoing. */
  due: string;
}

export const emptyQuestDraft: QuestDraft = { task: '', format: '', reward: '', slots: '', due: '' };

const MAX_SLOTS = 1000;

/** Reward in USDC (up to 2 decimals, more than 0, exact to the cent), or null when not valid. */
export function parseReward(raw: string): number | null {
  const v = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  const n = Number(v);
  return n > 0 && Number.isSafeInteger(Math.round(n * 100)) ? n : null;
}

/** Slots: a whole number from 1 to 1000, or null. */
export function parseSlots(raw: string): number | null {
  const v = raw.trim();
  if (!/^\d+$/.test(v)) return null;
  const n = Number(v);
  return n >= 1 && n <= MAX_SLOTS ? n : null;
}

/** The one gate for "Open quest": task, format, reward and slots all valid. */
export function questGate(d: QuestDraft): { blocking: boolean; label: string } {
  if (!d.task.trim()) return { blocking: true, label: 'Say what someone should do.' };
  if (!isQuestFormat(d.format)) return { blocking: true, label: 'Choose a format.' };
  if (parseReward(d.reward) === null) return { blocking: true, label: 'Set a reward in USDC, like 50 or 12.50.' };
  if (parseSlots(d.slots) === null) return { blocking: true, label: `Set the slots: a whole number from 1 to ${MAX_SLOTS}.` };
  return { blocking: false, label: `Holds ${budgetCap(parseReward(d.reward)!, parseSlots(d.slots)!).toFixed(2)} USDC before it opens.` };
}

/**
 * The quest part of a submission's gate, applied on top of the queue's own checks (domain/queue.ts gateFor). It needs the
 * full quest (Codex review on PR 102): an unknown quest blocks, a payout that is not the quest's reward blocks, and once
 * every slot is paid the budget is reached, so no further submission can be approved.
 */
export function submissionGate(queueGate: Gate, item: { payout: { amount: number; unit: string } }, quest: Quest | undefined): Gate {
  if (!quest) return { blocking: true, label: 'Quest not found.' };
  if (item.payout.unit !== 'USDC' || item.payout.amount !== quest.rewardUsdc) {
    return { blocking: true, label: `The payout (${item.payout.amount} ${item.payout.unit}) is not this quest’s reward (${quest.rewardUsdc} USDC).` };
  }
  if (quest.paid >= quest.slots) return { blocking: true, label: `All ${quest.slots} ${quest.slots === 1 ? 'slot is' : 'slots are'} paid; the budget is reached.` };
  return queueGate;
}

/** The outcome a paid submission records in the loop store; Today and Quests both write and read it. */
export const payoutOutcome = (payout: { amount: number; unit: string }): string => `Approved. The ${payout.amount} ${payout.unit} payout is queued.`;
export const isPayoutOutcome = (outcome: string | undefined): boolean => Boolean(outcome?.startsWith('Approved. The ') && outcome.endsWith(' payout is queued.'));

/**
 * The one action for paying a quest submission (Quests and Today call it). It resolves nothing on trust: it re-runs the
 * quest gate on the full quest over the queue gate it is given, and returns the outcome to record, or null when blocked.
 * INTEGRATION: POST /api/payouts (not built yet).
 */
export function approveSubmission(item: { payout: { amount: number; unit: string } }, quest: Quest | undefined, queueGate: Gate): string | null {
  return submissionGate(queueGate, item, quest).blocking ? null : payoutOutcome(item.payout);
}

/** One payout, its own record (kept in the brand-scoped loop store): slots used are counted from these, never from a queue. */
export interface PayoutRecord {
  /** The quest it was paid from; absent for an ambassador seat post. */
  questId?: string;
  submissionId: string;
  amount: number;
  unit: string;
  at: string;
}

/**
 * A quest with this session's payouts counted: its fixture `paid` plus the payout records made from it. Counting from
 * the records, not the current queue, keeps a slot used after its submission leaves the queue (Codex review on PR 111).
 */
export function questWithPayouts(quest: Quest, payouts: readonly PayoutRecord[]): Quest {
  return { ...quest, paid: quest.paid + payouts.filter((p) => p.questId === quest.id).length };
}
