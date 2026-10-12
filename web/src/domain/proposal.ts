// A learned-rule proposal: the UI contract for the learn loop (ADR-013 decision 3, module N5 "learn loop"; contract
// table in issue #90). Each proposal cites the outcomes it rests on, is judged by an evaluator other than the model
// that wrote it, changes nothing until the owner approves it, and names the Brain version it was judged against.
import type { Gate } from './approval';
import type { ArtboardName } from '../config/artboards';
import { nextBrainVersion, type BrainRule } from './brain';

/** Where the signal came from (ADR-012 runtime section). */
export type SignalSource = 'edit-to-rule' | 'approvals' | 'outcome' | 'platform-metrics';

export const signalLabels: Record<SignalSource, string> = {
  'edit-to-rule': 'From your edits',
  approvals: 'From your approvals and rejections',
  outcome: 'From a logged outcome',
  'platform-metrics': 'From platform metrics',
};

export type ProposalStatus = 'pending' | 'trial' | 'approved' | 'rejected';

export interface Proposal {
  id: string;
  /** The suggested Brain rule this proposal would make active. */
  ruleId: string;
  /** Stage and place it applies to, e.g. "Create · X". */
  scope: string;
  title: string;
  /** What the results show, in one or two sentences. */
  evidence: string;
  /** The outcomes it cites, and where to see them. */
  cites: { label: string; artboard: ArtboardName };
  signal: SignalSource;
  /** The evaluator that judged it: never the model that proposed it. */
  evaluator: { name: string; verdict: string; smallSample: boolean };
  /** The Brain version it was judged against. */
  brainVersion: string;
  status: ProposalStatus;
  /** When it was decided, and the Brain version an approval made (decided proposals). */
  decided?: { at: string; version?: string };
}

/**
 * The one gate for approving a proposal (Learn-Rules and Today read it). A proposal judged against an older Brain is
 * blocked until its evaluator checks it again, because the rules it was compared with have changed.
 */
export function proposalGate(p: Proposal, brainVersion: string): Gate {
  if (p.status === 'approved' || p.status === 'rejected') return { blocking: true, label: `Already ${p.status}.` };
  if (p.brainVersion !== brainVersion) return { blocking: true, label: `Judged against Brain v${p.brainVersion}; the Brain is now v${brainVersion}. Check it again before approving.` };
  return { blocking: false, label: `Checked against Brain v${brainVersion}.` };
}

/**
 * The one line that says where a proposal's rule stands (Today, Learn-Rules and the Brain all read it). The rule's
 * current status wins: a retired rule says retired, whatever the proposal decided. Otherwise from the proposal: a
 * pending one says what approving does; an approved one is active in the Brain version it made; a rejected one says so.
 */
export function proposalNote(p: Pick<Proposal, 'status' | 'decided'>, brainVersion: string, rule?: Pick<BrainRule, 'status' | 'decided'>): string {
  if (rule?.status === 'retired') return rule.decided ? `retired ${rule.decided.at}` : 'retired';
  const notes: Record<ProposalStatus, () => string> = {
    pending: () => `becomes Brain v${nextBrainVersion(brainVersion)} if you approve`,
    trial: () => `on trial for half of new drafts; becomes Brain v${nextBrainVersion(brainVersion)} if you approve`,
    approved: () => `active in Brain v${p.decided?.version ?? brainVersion}`,
    rejected: () => 'rejected',
  };
  return notes[p.status]();
}
