// The Brain: the UI contract for the brand intelligence system (ADR-013 decision 2, module X18 "brand memory";
// ADR-012 decision 4, PR #86; contract table in issue #90). Layers 2 and 3 replace the fixtures behind this type.
//
// Learned rules are Brain state, not kit content: approving or retiring a rule bumps the Brain version and leaves the
// kit version, and its registration on Solana, unchanged (ADR-012 runtime section). Only a kit change re-registers.

/** Where a fact comes from: a quoted page, or a dated owner answer (ADR-011: the only kinds of evidence). */
export interface FactSource {
  kind: 'page' | 'owner-answer';
  /** "adna.network/docs" or "Owner answer". */
  label: string;
  /** When it was read or answered, e.g. "3 Oct". */
  at: string;
}

/** A fact with its receipt: the exact quote and its source (X18 evidence). */
export interface BrainFact {
  id: string;
  quote: string;
  source: FactSource;
}

export interface BrainVoice {
  id: string;
  name: string;
  /** Voice version, e.g. "v2". */
  version: string;
  /** Dial summary, e.g. "candid 4, technical 3, playful 2". */
  dials: string;
}

export type RuleStatus = 'suggested' | 'active' | 'retired';

/** What a rule rests on (X18 decision history and outcomes). */
export interface EvidenceRef {
  kind: 'posts' | 'events' | 'outcome' | 'edit' | 'kit-gate';
  /** "14 posts", "3 events", "Your edit, 4 Oct". */
  label: string;
}

export interface BrainRule {
  id: string;
  text: string;
  /** Where it applies: "Create · X", "All voices", "Claims gate". */
  appliesTo: string;
  /** Who or what proposed it: Learn, a kit gate, an owner edit. */
  origin: 'learn' | 'kit' | 'owner';
  status: RuleStatus;
  evidence: EvidenceRef[];
  /** The decision on the rule, once made ("Approved 10 Oct"). */
  decided?: { by: string; at: string };
}

/** One Brain version and what changed in it. */
export interface BrainChange {
  version: string;
  summary: string;
  at: string;
}

export interface BrainKit {
  /** Registered kit version, e.g. 3 (shown "v3"). */
  version: number;
  registered: boolean;
  sections: number;
  /** Facts with receipts in the Brain, from how many sources, and how many expire this month (claims). */
  factCount: number;
  sources: number;
  expiringFacts: number;
  audience: string;
}

export interface Brain {
  brandName: string;
  /** Brain version "<kit>.<revision>", e.g. "3.1": the kit version, then every rule change since it. */
  version: string;
  kit: BrainKit;
  voices: BrainVoice[];
  facts: BrainFact[];
  rules: BrainRule[];
  /** Newest first. */
  history: BrainChange[];
}

/**
 * The next Brain version after a rule change: same kit, next revision ("3.1" to "3.2"). The kit version is not
 * touched, because learned rules are not part of the registered kit.
 */
export function nextBrainVersion(version: string): string {
  const [kit, rev = '0'] = version.split('.');
  return `${kit}.${Number(rev) + 1}`;
}

export const formatBrainVersion = (version: string) => `Brain v${version}`;


/**
 * The Brain's rules in their two kinds, the one selector every screen reads (Codex review on PR 111): `learned` are
 * the rules Learn proposed and the owner decides (counted as learned, approvable and retirable); `standing` are the
 * kit's gates, which come from the approved, registered kit and only change with a new kit version, and the owner's
 * own edits (ADR-012: learned rules stay out of the registered kit).
 */
export function brainRules(brain: Brain) {
  const learned = brain.rules.filter((r) => r.origin === 'learn');
  return {
    learned,
    standing: brain.rules.filter((r) => r.origin !== 'learn'),
    activeLearned: learned.filter((r) => r.status === 'active').length,
    waiting: learned.filter((r) => r.status === 'suggested').length,
  };
}
