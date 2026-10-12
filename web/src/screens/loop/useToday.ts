import { useState } from 'react';
import type { Gate } from '../../domain/approval';
import { nextBrainVersion, rulesWith } from '../../domain/brain';
import { gateFor, primaryActions, type QueueItem, type QueueKind } from '../../domain/queue';
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
    const a = loop.approvalOf(item.id, item.text);
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
  const ctx = { brainVersion: loop.brain.version, proposal: loop.proposal };
  const acts: Partial<Record<QueueKind, (item: QueueItem) => void>> = {
    draft: (i) => loop.approveItem(i.id, i.text),
    reply: (i) => loop.finish(i.id, primaryActions.reply?.done ?? ''),
    ambassadorPost: (i) => i.kind === 'ambassadorPost' && loop.finish(i.id, `Approved. The ${i.payout.amount} ${i.payout.unit} payout is queued.`),
    learnedRule: (i) => {
      const p = i.kind === 'learnedRule' && loop.proposal(i.proposalId);
      if (p) loop.approveProposal(p);
    },
  };
  const rows: QueueRow[] = data.queue.map((item) => {
    const act = acts[item.kind];
    const meta = item.kind === 'learnedRule' ? `${item.meta} · becomes Brain v${nextBrainVersion(loop.brain.version)} if you approve` : item.meta;
    return { item: { ...item, meta }, gate: gateFor(item, ctx), ...standing(item, loop), act: act && (() => act(item)) };
  });
  const pending = rows.filter((r) => !r.outcome);
  const shown = rows.filter((r) => filter === 'all' || r.item.kind === filter);

  const brand = loop.brain;
  const detail = (s: TodayData['loop'][number]) => (s.stage === 'brand' ? `Kit v${brand.kit.version} · ${brand.voices.length} voices · ${rulesWith(brand, 'active').length} active rules` : s.detail);
  const steps: (TimelineStep & { href: TodayData['loop'][number]['link'] })[] = data.loop.map((s) => ({
    label: `${stageById(s.stage).step} ${stageById(s.stage).label}`,
    state: stepLook[s.state],
    note: detail(s),
    href: s.link,
  }));

  return { loop, rows, shown, pending, filter, setFilter: (v: string) => setFilter(v as QueueFilter), steps, progress: loopProgressLabel(data.loop.map((s) => s.state)) };
}
