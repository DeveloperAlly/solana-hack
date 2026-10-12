import { useState } from 'react';
import type { Gate } from '../../domain/approval';
import { nextBrainVersion, rulesWith } from '../../domain/brain';
import { gateFor, primaryActions, type QueueItem, type QueueKind } from '../../domain/queue';
import { approveSubmission, payoutOutcome, questWithPayouts } from '../../domain/quest';
import { stageById } from '../../config/nav';
import { loopProgressLabel, type LoopStepState } from '../../domain/loop';
import type { TimelineStep, TimelineStepState } from '../../ui/composites/StatusTimeline';
import { useLoop, type LoopFlow } from '../../flows/loop/useLoop';
import type { TodayData } from './types';

export type QueueFilter = 'all' | QueueKind;

/** How the strip draws each step state. */
const stepLook: Record<LoopStepState, TimelineStepState> = { live: 'done', current: 'current', 'not-started': 'todo' };

/** One queue row as the screen shows it: the item, its gate, and where it stands after this session's decisions. */
export interface QueueRow {
  item: QueueItem;
  gate: Gate;
  /** Set once decided; replaces the actions. */
  outcome?: string;
  /** A line that stays: an approval gone stale, a trial running. */
  status?: string;
  /** The one-tap action, for kinds that have one. */
  act?: () => void;
}

/**
 * The one "needs you" selector, read by Today and M-Today so their counts and lists agree: every undecided item
 * (no outcome yet) needs you; of those, the one-tap ones have an action that no check blocks (the phone slots);
 * decided items move to Done. A stale approval has no outcome, so it needs you again.
 */
export function selectQueue(rows: QueueRow[]) {
  const needsYou = rows.filter((r) => !r.outcome);
  return { needsYou, oneTap: needsYou.filter((r) => r.act && !r.gate.blocking), done: rows.filter((r) => r.outcome) };
}

/** Where a decided item stands, from the shared loop state, so a decision made on another screen shows here too. */
function standing(item: QueueItem, loop: LoopFlow): Pick<QueueRow, 'outcome' | 'status'> {
  if (item.kind === 'learnedRule') {
    const p = loop.proposal(item.proposalId);
    const view = {
      approved: { outcome: `Approved. The rule is active in Brain v${loop.brain.version}; the kit is unchanged.` },
      rejected: { outcome: 'Rejected. The Brain is unchanged.' },
      trial: { status: 'Running as a trial on half of new drafts.' },
      pending: {},
    };
    return p ? view[p.status] : {};
  }
  if (item.kind === 'draft') {
    const view = {
      valid: { outcome: primaryActions.draft?.done },
      stale: { status: 'Your approval went stale: the Brain changed since. Approve it again.' },
    };
    const a = loop.approvalOf(item.id, { text: item.text, checks: item.checks });
    return a ? view[a] : {};
  }
  const done = loop.outcome(item.id);
  return done ? { outcome: done } : {};
}

/**
 * Today's flow: the one queue with its gates, the kind filter, the one-tap actions, and the loop strip, all read from
 * the shared loop state (flows/loop). Approving a learned rule here bumps the Brain, which makes approvals bound to
 * the old version stale on this list and on every other screen.
 */
export function useToday(data: TodayData) {
  const loop = useLoop(data);
  const [filter, setFilter] = useState<QueueFilter>('all');
  const submissions = data.queue.flatMap((i) => (i.kind === 'ambassadorPost' ? [{ id: i.id, questId: i.questId }] : []));
  const quest = (id: string) => {
    const q = data.quests?.find((x) => x.id === id);
    return q && questWithPayouts(q, submissions, loop.outcomes);
  };
  const ctx = { brainVersion: loop.brain.version, proposal: loop.proposal, quest };
  const acts: Partial<Record<QueueKind, (item: QueueItem) => void>> = {
    draft: (i) => { if (i.kind === 'draft' && !gateFor(i, ctx).blocking) loop.approveItem(i.id, { text: i.text, checks: i.checks }); },
    reply: (i) => loop.finish(i.id, primaryActions.reply?.done ?? ''),
    // Every payout goes through domain/quest.ts: a quest submission through approveSubmission (it re-runs the quest
    // gate), a seat post through its gate and the shared payout outcome. Today builds no payout path of its own.
    ambassadorPost: (i) => {
      if (i.kind !== 'ambassadorPost') return;
      const gate = gateFor(i, ctx);
      const outcome = i.questId ? approveSubmission(i, quest(i.questId), gate) : !gate.blocking && payoutOutcome(i.payout);
      if (outcome) loop.finish(i.id, outcome);
    },
    learnedRule: (i) => {
      const p = i.kind === 'learnedRule' && loop.proposal(i.proposalId);
      if (p) loop.approveProposal(p);
    },
  };
  const rows: QueueRow[] = data.queue.map((item) => {
    const act = acts[item.kind];
    const meta = item.kind === 'learnedRule' ? `${item.meta} · becomes Brain v${nextBrainVersion(loop.brain.version)} if you approve` : item.meta;
    return { item: { ...item, meta }, gate: gateFor(item, ctx), ...standing(item, loop), act: act && (() => { if (!gateFor(item, ctx).blocking) act(item); }) };
  });
  const { needsYou, oneTap, done } = selectQueue(rows);
  const shown = needsYou.filter((r) => filter === 'all' || r.item.kind === filter);

  const brand = loop.brain;
  const detail = (s: TodayData['loop'][number]) => (s.stage === 'brand' ? `Kit v${brand.kit.version} · ${brand.voices.length} voices · ${rulesWith(brand, 'active').length} active rules` : s.detail);
  const steps: (TimelineStep & { href: TodayData['loop'][number]['link'] })[] = data.loop.map((s) => ({
    label: `${stageById(s.stage).step} ${stageById(s.stage).label}`,
    state: stepLook[s.state],
    note: detail(s),
    href: s.link,
  }));

  return { loop, needsYou, oneTap, done, shown, filter, setFilter: (v: string) => setFilter(v as QueueFilter), steps, progress: loopProgressLabel(data.loop.map((s) => s.state)) };
}
