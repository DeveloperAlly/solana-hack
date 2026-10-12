import { useState } from 'react';
import type { Gate } from '../../domain/approval';
import { gateFor, type GateContext, type QuestSubmissionItem } from '../../domain/queue';
import {
  budgetCap, emptyQuestDraft, isQuestFormat, parseReward, parseSlots, questState, questWithPaid,
  type Quest, type QuestDraft, type QuestState,
} from '../../domain/quest';
import { loopStore } from '../../flows/loop/store';
import { paySubmission } from '../../flows/loop/payout';
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
  item: QuestSubmissionItem;
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
  /** Approve and pay through the one payout path (flows/loop/payout.ts), recorded in the loop store Today reads. */
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
  const [loop] = loopStore.use();
  const brainVersion = useBrainVersion();
  const [focus, setFocus] = useState<string | null>(null);
  const [form, setForm] = useState<QuestsFlow['form']>(null);
  const decided = (id: string) => Boolean(loop.outcomes[id]);
  const all = [...session.questsAdded, ...data.quests];
  // The same context Today gives gateFor: quest slots with this session's payouts counted.
  const ctx: GateContext = {
    brainVersion,
    proposal: () => undefined,
    quest: (id) => { const q = all.find((x) => x.id === id); return q && questWithPaid(q, loop.questPaid); },
  };
  const ownSlotFree: GateContext = { ...ctx, quest: (id) => { const q = ctx.quest(id); return q && { ...q, paid: Math.min(q.paid, q.slots - 1) }; } };
  const quests = all.map((q) => {
    const quest = questWithPaid(q, loop.questPaid);
    const waiting = data.submissions.filter((s) => s.questId === q.id && !decided(s.id)).length;
    return { quest, state: questState(quest, waiting), waiting, terms: terms(quest, waiting) };
  });
  const submissions = data.submissions
    .filter((s) => !focus || s.questId === focus)
    // A paid submission is judged with its own slot counted free: the slot it filled never marks it blocked afterwards.
    .map((item) => ({ item, gate: gateFor(item, decided(item.id) ? ownSlotFree : ctx), outcome: loop.outcomes[item.id] }));
  // Paid this session: each quest's slots paid since its fixture count, at its reward.
  const paidSession = all.reduce((n, q) => n + (questWithPaid(q, loop.questPaid).paid - q.paid) * q.rewardUsdc, 0);

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
      paySubmission(id, gateFor(item, ctx), item.questId, ctx.quest(item.questId), item.payout);
    },
  };
}
