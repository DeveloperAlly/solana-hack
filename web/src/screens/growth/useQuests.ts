import { useState } from 'react';
import type { Gate } from '../../domain/approval';
import { gateFor, type AmbassadorPostItem, type GateContext } from '../../domain/queue';
import { budgetCap, emptyQuestDraft, isQuestFormat, parseReward, parseSlots, questState, submissionGate, type Quest, type QuestDraft, type QuestState } from '../../domain/quest';
import { loopStore } from '../../flows/loop/store';
import { uniqueId } from '../../lib/id';
import { growthSession } from './session';
import { eventDay } from './eventPlan';
import type { QuestsData } from './types';

/** Ambassador-post gates read nothing from the Brain or the learn loop. */
const gateContext: GateContext = { brainVersion: '', proposal: () => undefined };

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
  /** Approve and pay, through the one queue's outcomes (Today shows the same decision). INTEGRATION: POST /api/payouts (not built). */
  approve: (id: string) => void;
}

function terms(q: Quest, waiting: number): string {
  const due = q.due ? `due ${q.due}` : 'ongoing';
  if (q.opens) return `${q.rewardUsdc} USDC each · ${q.slots} slots · opens ${q.opens}`;
  if (q.paid >= q.slots) return `${q.rewardUsdc} USDC each · ${q.paid} of ${q.slots} paid · ${budgetCap(q.rewardUsdc, q.slots)} USDC cap reached`;
  return `${q.rewardUsdc} USDC each · ${q.slots - q.paid} of ${q.slots} slots left${waiting ? ` · ${waiting} submitted` : ''} · ${due}`;
}

/** Quests flow state (one hook): quests with their state, submissions as queue items, the new-quest form. */
export function useQuests(data: QuestsData): QuestsFlow {
  const [session, set] = growthSession.use();
  const [loop, setLoop] = loopStore.use();
  const [focus, setFocus] = useState<string | null>(null);
  const [form, setForm] = useState<QuestsFlow['form']>(null);
  const decided = (id: string) => Boolean(loop.outcomes[id]);
  const all = [...session.questsAdded, ...data.quests];
  const paidNow = (q: Quest) => q.submissionIds.filter((id) => loop.outcomes[id]?.startsWith('Approved')).length;
  const quests = all.map((q) => {
    const quest = { ...q, paid: q.paid + paidNow(q) };
    const waiting = q.submissionIds.filter((id) => !decided(id)).length;
    return { quest, state: questState(quest, waiting), waiting, terms: terms(quest, waiting) };
  });
  // One gate per submission: the queue's gate plus the quest's free slots, read by the badge and Approve alike.
  // A decided submission keeps its own queue gate: the slots it filled never mark it blocked afterwards.
  const gateOf = (item: AmbassadorPostItem) => {
    const own = gateFor(item, gateContext);
    return decided(item.id) ? own : submissionGate(own, quests.find((v) => v.quest.submissionIds.includes(item.id))?.quest);
  };
  const submissions = data.submissions
    .filter((s) => !focus || all.find((q) => q.id === focus)?.submissionIds.includes(s.id))
    .map((item) => ({ item, gate: gateOf(item), outcome: loop.outcomes[item.id] }));
  const paidSession = data.submissions.filter((s) => loop.outcomes[s.id]?.startsWith('Approved')).reduce((n, s) => n + s.payout.amount, 0);

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
      const quest: Quest = { id: uniqueId('qst'), task: d.task.trim(), format: d.format, rewardUsdc: reward, slots, paid: 0, due: d.due ? eventDay(d.due) : null, opens: null, submissionIds: [] };
      set({ questsAdded: [quest, ...session.questsAdded] });
      setForm(null);
    },
    approve: (id) => {
      const item = data.submissions.find((s) => s.id === id);
      if (!item || gateOf(item).blocking || decided(id)) return;
      setLoop({ outcomes: { ...loop.outcomes, [id]: `Approved. The ${item.payout.amount} ${item.payout.unit} payout is queued.` } });
    },
  };
}
