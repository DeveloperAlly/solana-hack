import { useMemo } from 'react';
import { fingerprintOf, isStale } from '../../domain/approval';
import { nextBrainVersion, type Brain, type BrainRule } from '../../domain/brain';
import type { Proposal } from '../../domain/proposal';
import { approveSubmission, type Quest } from '../../domain/quest';
import type { Gate } from '../../domain/approval';
import { loopStore, today } from './store';

/** The loop fixtures a screen starts from: the Brain, the learn loop's proposals, and who approves. */
export interface LoopBase {
  brain: Brain;
  proposals: Proposal[];
  /** The signed-in owner, bracketed in fixtures. */
  approver: string;
  /** Quests whose submissions can reach the queue. */
  quests?: Quest[];
}

export interface LoopFlow {
  /** The Brain with this session's changes applied. */
  brain: Brain;
  proposals: Proposal[];
  proposal: (id: string) => Proposal | undefined;
  approveProposal: (p: Proposal) => void;
  rejectProposal: (p: Proposal) => void;
  /** "Try on half of drafts": an experiment, not a Brain change. */
  trialProposal: (p: Proposal) => void;
  /** The evaluator judges it again against the current Brain. INTEGRATION: POST /api/proposals/:id/check (not built). */
  recheckProposal: (p: Proposal) => void;
  retireRule: (r: BrainRule) => void;
  /** Records a queue approval bound to `inputs` and the current Brain version. */
  approveItem: (id: string, inputs: unknown) => void;
  /** Whether a recorded queue approval still holds for `inputs` under the current Brain; undefined when none. */
  approvalOf: (id: string, inputs: unknown) => 'valid' | 'stale' | undefined;
  /** Records an irreversible outcome (sent, paid). */
  finish: (id: string, outcome: string) => void;
  outcome: (id: string) => string | undefined;
  /** A quest with this session's paid slots. */
  quest: (id: string) => Quest | undefined;
  /** Approves a paid submission through domain/quest.ts `approveSubmission` (the one payout path). */
  paySubmission: (itemId: string, gate: Gate, questId: string | undefined, payout: { amount: number; unit: 'USDC' }) => void;
}

/**
 * The loop flow (one hook for every loop screen): the fixture Brain and proposals with the session's changes
 * merged in, and the actions that change them. A rule change bumps the Brain version and never the kit version
 * (learned rules are not part of the registered kit; ADR-012 runtime section).
 */
export function useLoop(base: LoopBase): LoopFlow {
  const [state, set] = loopStore.use();
  const version = state.brainVersion ?? base.brain.version;

  const brain = useMemo<Brain>(() => ({
    ...base.brain,
    version,
    rules: base.brain.rules.map((r) => (state.rules[r.id] ? { ...r, ...state.rules[r.id] } : r)),
    history: [...state.history, ...base.brain.history],
  }), [base.brain, version, state.rules, state.history]);

  const proposals = useMemo(() => base.proposals.map((p) => ({ ...p, ...state.proposals[p.id] })), [base.proposals, state.proposals]);
  const proposal = (id: string) => proposals.find((p) => p.id === id);

  function changeRule(rule: { id: string; text: string }, status: 'active' | 'retired', extra: Partial<typeof state> = {}) {
    const s = loopStore.read();
    const next = nextBrainVersion(s.brainVersion ?? base.brain.version);
    const at = today();
    set({
      ...extra,
      brainVersion: next,
      rules: { ...s.rules, [rule.id]: { status, decided: { by: base.approver, at } } },
      history: [{ version: next, summary: `Rule "${rule.text}" ${status === 'active' ? 'approved' : 'retired'} by ${base.approver}`, at }, ...s.history],
    });
  }
  const setProposal = (p: Proposal, change: object) => {
    const s = loopStore.read();
    return { proposals: { ...s.proposals, [p.id]: { ...s.proposals[p.id], ...change } } };
  };
  const fp = (inputs: unknown) => fingerprintOf(inputs, loopStore.read().brainVersion ?? base.brain.version);

  return {
    brain,
    proposals,
    proposal,
    approveProposal: (p) => {
      const rule = base.brain.rules.find((r) => r.id === p.ruleId);
      if (rule) changeRule(rule, 'active', setProposal(p, { status: 'approved', decided: { at: today() } }));
    },
    rejectProposal: (p) => set(setProposal(p, { status: 'rejected', decided: { at: today() } })),
    trialProposal: (p) => set(setProposal(p, { status: 'trial' })),
    recheckProposal: (p) => set(setProposal(p, { brainVersion: version })),
    retireRule: (r) => changeRule(r, 'retired'),
    approveItem: (id, inputs) => set({ approvals: { ...loopStore.read().approvals, [id]: { by: base.approver, at: today(), fingerprint: fp(inputs) } } }),
    approvalOf: (id, inputs) => {
      const a = state.approvals[id];
      return a && (isStale(a, fingerprintOf(inputs, version)) ? 'stale' : 'valid');
    },
    finish: (id, outcome) => set({ outcomes: { ...loopStore.read().outcomes, [id]: outcome } }),
    outcome: (id) => state.outcomes[id],
    quest: (id) => {
      const q = base.quests?.find((x) => x.id === id);
      return q && { ...q, paid: state.questPaid[id] ?? q.paid };
    },
    paySubmission: (itemId, gate, questId, payout) => {
      const s = loopStore.read();
      const q = questId ? base.quests?.find((x) => x.id === questId) : undefined;
      const current = q && { ...q, paid: s.questPaid[q.id] ?? q.paid };
      const r = approveSubmission(gate, current, payout);
      if (!r.ok) return;
      set({ outcomes: { ...s.outcomes, [itemId]: r.outcome }, ...(q ? { questPaid: { ...s.questPaid, [q.id]: r.paid } } : {}) });
    },
  };
}
