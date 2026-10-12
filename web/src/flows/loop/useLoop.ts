import { useMemo } from 'react';
import { fingerprintOf, isStale } from '../../domain/approval';
import { nextBrainVersion, type Brain, type BrainRule } from '../../domain/brain';
import type { Proposal } from '../../domain/proposal';
import { loopStore, today } from './store';

/** The loop fixtures a screen starts from: the Brain, the learn loop's proposals, and who approves. */
export interface LoopBase {
  brain: Brain;
  proposals: Proposal[];
  /** The signed-in owner, bracketed in fixtures. */
  approver: string;
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
  /** Every recorded outcome, by item id (quests count their payouts from it). */
  outcomes: Record<string, string>;
}

/**
 * The loop flow (one hook for every loop screen): the fixture Brain and proposals with the session's changes
 * merged in, and the actions that change them. A rule change bumps the Brain version and never the kit version
 * (learned rules are not part of the registered kit; ADR-012 runtime section).
 */
export function useLoop(base: LoopBase): LoopFlow {
  const [state, set] = loopStore.use();
  const version = state.brainVersion ?? base.brain.version;

  const proposals = useMemo(() => base.proposals.map((p) => ({ ...p, ...state.proposals[p.id] })), [base.proposals, state.proposals]);

  // A suggested rule is its proposal: its status is derived from the proposal, never stored twice, so rejecting on
  // Learn-Rules or approving on Today shows the same on the Brain (Codex review on PR 111). A rejected suggestion
  // never entered the Brain, so it leaves the list; an approved one is active. Retiring an active rule is a Brain
  // change of its own (state.rules).
  const brain = useMemo<Brain>(() => {
    const fromProposal = (r: BrainRule): BrainRule[] => {
      const p = r.status === 'suggested' ? proposals.find((x) => x.ruleId === r.id) : undefined;
      if (p?.status === 'rejected') return [];
      if (p?.status === 'approved') return [{ ...r, status: 'active', decided: { by: base.approver, at: p.decided?.at ?? '' } }];
      return [r];
    };
    return {
      ...base.brain,
      version,
      rules: base.brain.rules.flatMap(fromProposal).map((r) => (state.rules[r.id] ? { ...r, ...state.rules[r.id] } : r)),
      history: [...state.history, ...base.brain.history],
    };
  }, [base.brain, base.approver, version, proposals, state.rules, state.history]);

  const proposal = (id: string) => proposals.find((p) => p.id === id);

  /** A Brain change: the next Brain version and its history line, with the record that changed. */
  function bump(summary: string, change: (at: string) => Partial<typeof state>) {
    const s = loopStore.read();
    const next = nextBrainVersion(s.brainVersion ?? base.brain.version);
    const at = today();
    set({ ...change(at), brainVersion: next, history: [{ version: next, summary: `${summary} by ${base.approver}`, at }, ...s.history] });
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
      if (rule) bump(`Rule "${rule.text}" approved`, (at) => setProposal(p, { status: 'approved', decided: { at } }));
    },
    rejectProposal: (p) => set(setProposal(p, { status: 'rejected', decided: { at: today() } })),
    trialProposal: (p) => set(setProposal(p, { status: 'trial' })),
    recheckProposal: (p) => set(setProposal(p, { brainVersion: version })),
    retireRule: (r) => bump(`Rule "${r.text}" retired`, (at) => ({ rules: { ...loopStore.read().rules, [r.id]: { status: 'retired', decided: { by: base.approver, at } } } })),
    approveItem: (id, inputs) => set({ approvals: { ...loopStore.read().approvals, [id]: { by: base.approver, at: today(), fingerprint: fp(inputs) } } }),
    approvalOf: (id, inputs) => {
      const a = state.approvals[id];
      return a && (isStale(a, fingerprintOf(inputs, version)) ? 'stale' : 'valid');
    },
    finish: (id, outcome) => set({ outcomes: { ...loopStore.read().outcomes, [id]: outcome } }),
    outcome: (id) => state.outcomes[id],
    outcomes: state.outcomes,
  };
}
