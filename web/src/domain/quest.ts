// Quests: paid community tasks in USDC (canvas v24 board Quests, COMING SOON; component inventory D53 QuestCard).
// A quest is a one-off paid task; an ambassador seat is ongoing. Submissions are checked by the same no-AI-slop pass and
// claims gate as the brand's own posts, carry the disclosure, and go to the one approval queue (domain/queue.ts) as
// ambassador posts with a payout, tagged with their questId: no second queue. Quests and Today share the one gate
// (queue.ts gateFor, which applies submissionGate) and the one action, approveSubmission. Rewards go to the doer's own wallet (backend map). No paid posting
// on X (pitch deck "Why now").

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

/** What a quest submission's gate reads: the slots and how many are paid (this session's approvals included). */
export type QuestSlots = Pick<Quest, 'paid' | 'slots'>;

/** The budget held before a quest opens: reward × slots, to the cent. */
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
 * The free-slot part of a quest submission's gate, applied on top of the queue's own checks (domain/queue.ts gateFor).
 * Once every slot is paid the budget is reached, so no further submission can be approved (Codex review on PR 102).
 */
export function submissionGate(queueGate: { blocking: boolean; label: string }, quest: QuestSlots | undefined): { blocking: boolean; label: string } {
  if (quest && quest.paid >= quest.slots) return { blocking: true, label: `All ${quest.slots} ${quest.slots === 1 ? 'slot is' : 'slots are'} paid; the budget is reached.` };
  return queueGate;
}

/** The outcome a paid submission records in the loop store; Today and Quests both write and read it. */
export const payoutOutcome = (payout: { amount: number; unit: string }): string => `Approved. The ${payout.amount} ${payout.unit} payout is queued.`;
export const isPayoutOutcome = (outcome: string | undefined): boolean => Boolean(outcome?.startsWith('Approved. The ') && outcome.endsWith(' payout is queued.'));

/**
 * The one action for paying a quest submission (Quests and Today call it): it re-checks the gate it is given, which must
 * come from queue.ts gateFor with this session's quest slots, and returns the outcome to record, or null when blocked.
 * INTEGRATION: POST /api/payouts (not built yet).
 */
export function approveSubmission(item: { payout: { amount: number; unit: string } }, gate: { blocking: boolean }): string | null {
  return gate.blocking ? null : payoutOutcome(item.payout);
}

/** A quest's slots with this session's approvals counted: its fixture `paid` plus its submissions paid since. */
export function questSlots(quest: Quest, submissions: { id: string; questId?: string }[], outcomes: Record<string, string>): QuestSlots {
  const paidNow = submissions.filter((s) => s.questId === quest.id && isPayoutOutcome(outcomes[s.id])).length;
  return { paid: quest.paid + paidNow, slots: quest.slots };
}
