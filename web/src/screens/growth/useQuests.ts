import { useState } from 'react';
import type { Gate } from '../../domain/approval';
import { gateFor, type AmbassadorPostItem, type GateContext } from '../../domain/queue';
import {
  approveSubmission, budgetCap, isPayoutOutcome, emptyQuestDraft, isQuestFormat, parseReward, parseSlots, questWithPayouts, questState,
  type Quest, type QuestDraft, type QuestState,
} from '../../domain/quest';
import { loopStore } from '../../flows/loop/store';
import { useBrainVersion } from '../../flows/loop/brainVersion';
import { uniqueId } from '../../lib/id';
import { eventDay } from './eventPlan';
import { growthSession } from './session';
import type { QuestsData } from './types';

export interface QuestView {
  quest: Quest;
  state: QuestState;
  waiting: number;
  terms: string;
}

export interface SubmissionRow {
  item: AmbassadorPostItem;
  gate: Gate;
  outcome?: string;
}

export interface QuestsFlow {
  quests: QuestView[];
  submissions: SubmissionRow[];
  /** Quest whose submissions are shown; null shows all. */
  focus: string | null;
  setFocus: (id: string | null) => void;
  waiting: number;
  paidThisMonth: number;
  /** The form's starting values; a new key remounts the form with them. */
  form: { key: string; initial: QuestDraft } | null;
  openForm: (initial?: QuestDraft) => void;
  closeForm: () => void;
  /** INTEGRATION: POST /api/quests, with the budget cap held first (not built yet). */
  open: (d: QuestDraft) => void;
  /** Approve and pay through the shared action (domain/quest.ts approveSubmission), recorded in the loop store Today reads. */
  approve: (id: string) => void;
}

function terms(q: Quest, waiting: number): string {
  const due = q.due ? `due ${q.due}` : 'ongoing';
  if (q.opens) return `${q.rewardUsdc} USDC each · ${q.slots} slots · opens ${q.opens}`;
  if (q.paid >= q.slots) return `${q.rewardUsdc} USDC each · ${q.paid} of ${q.slots} paid · ${budgetCap(q.rewardUsdc, q.slots)} USDC cap reached`;
  return `${q.rewardUsdc} USDC each · ${q.slots - q.paid} of ${q.slots} slots left${waiting ? ` · ${waiting} submitted` : ''} · ${due}`;
}

/** Quests flow state (one hook): quests with their state, submissions as items of the one queue, the new-quest form. */
export function useQuests(data: QuestsData): QuestsFlow {
  const [session, set] = growthSession.use();
  const [loop, setLoop] = loopStore.use();
  const brainVersion = useBrainVersion();
  const [focus, setFocus] = useState<string | null>(null);
  const [form, setForm] = useState<QuestsFlow['form']>(null);
  const decided = (id: string) => Boolean(loop.outcomes[id]);
  const all = [...session.questsAdded, ...data.quests];
  // The same context Today gives gateFor: quest slots with this session's payouts counted.
  const ctx: GateContext = {
    brainVersion,
    proposal: () => undefined,
    quest: (id) => { const q = all.find((x) => x.id === id); return q && questWithPayouts(q, data.submissions, loop.outcomes); },
  };
  const quests = all.map((q) => {
    const quest = questWithPayouts(q, data.submissions, loop.outcomes);
    const waiting = data.submissions.filter((s) => s.questId === q.id && !decided(s.id)).length;
    return { quest, state: questState(quest, waiting), waiting, terms: terms(quest, waiting) };
  });
  const submissions = data.submissions
    .filter((s) => !focus || s.questId === focus)
    // A decided submission shows its own checks: the slot it filled never marks it blocked afterwards.
    .map((item) => ({ item, gate: decided(item.id) ? { blocking: false, label: 'Submission paid.' } : gateFor(item, ctx), outcome: loop.outcomes[item.id] }));
  const paidSession = data.submissions.filter((s) => isPayoutOutcome(loop.outcomes[s.id])).reduce((n, s) => n + s.payout.amount, 0);

  return {
    quests,
    submissions,
    focus,
    setFocus,
    waiting: data.submissions.filter((s) => !decided(s.id)).length,
    paidThisMonth: data.paidThisMonth + paidSession,
    form,
    openForm: (initial = emptyQuestDraft) => setForm({ key: uniqueId('quest-form'), initial }),
    closeForm: () => setForm(null),
    open: (d) => {
      const reward = parseReward(d.reward);
      const slots = parseSlots(d.slots);
      if (!d.task.trim() || !isQuestFormat(d.format) || reward === null || slots === null) return;
      const quest: Quest = { id: uniqueId('qst'), task: d.task.trim(), format: d.format, rewardUsdc: reward, slots, paid: 0, due: d.due ? eventDay(d.due) : null, opens: null };
      set({ questsAdded: [quest, ...session.questsAdded] });
      setForm(null);
    },
    approve: (id) => {
      const item = data.submissions.find((s) => s.id === id);
      if (!item || decided(id)) return;
      const outcome = approveSubmission(item, item.questId ? ctx.quest?.(item.questId) : undefined, gateFor(item, ctx));
      if (outcome) setLoop({ outcomes: { ...loop.outcomes, [id]: outcome } });
    },
  };
}
