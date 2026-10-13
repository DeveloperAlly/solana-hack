/*
 * useJourneyFlow: the one place the first-run flow lives (issue #48): the step order, next and back, whether each step
 * is finished, and every selection the person makes (sign-in on J2, fact decisions on J3,
 * alternatives, answers and voice picks on J4, gate decisions on J5). Selections sit in a small module store, so they
 * survive moving between the /screens/<Artboard> routes in one visit. Nothing is preselected and nothing is sent; each
 * action names the endpoint that will persist it once the flow is wired.
 */
import { createContext, useContext } from 'react';
import { createStore } from '../../lib/createStore';
import type { GateDecision } from '../../ui/domain/DecisionGate';
import { journeySteps, useJourneyHref, type JourneyStepId } from './paths';
import type { FactDecision, FactRecord, GateApproval } from './types';

export type VoiceRound = 1 | 2;

/** J4's voice: picks over two rounds, or one sentence instead. One shape, so both can never be held at once. */
export type VoiceChoice =
  | { mode: 'picks'; round: VoiceRound; picks: Partial<Record<VoiceRound, string>> }
  | { mode: 'sentence'; sentence: string };

/** J2 sign-in as a state machine: a code is accepted only once an email was sent. */
export type SignInPhase = 'email' | 'sending' | 'code';

/** The post approved and registered on J6, carried to J7 and J8. */
export interface ApprovedPost {
  channelLabel: string;
  text: string;
}

export interface JourneySelections {
  /** The address typed on Main; J1 reads it. Empty until a journey starts from Main. */
  site: string;
  signIn: SignInPhase;
  emailSentTo: string;
  /** One record per found fact: the decision, and the person's wording only when it was edited. Undo removes it. */
  facts: Record<string, FactRecord>;
  alternatives: string[];
  customAlternatives: string[];
  answers: Record<string, string>;
  voice: VoiceChoice;
  gateDrafts: Record<string, string>;
  gateApprovals: Record<string, GateApproval | null>;
  /** Whether kit v1 reached Solana: true after J5 registers it, false after a retry fails, undefined before J5. */
  kitRegistered?: boolean;
  /** The channel tab chosen on J6. */
  postChannel?: string;
  post?: ApprovedPost;
}

/** The selections before anything is chosen (a new visit). */
export const initialSelections: JourneySelections = {
  site: '',
  signIn: 'email',
  emailSentTo: '',
  facts: {},
  alternatives: [],
  customAlternatives: [],
  answers: {},
  voice: { mode: 'picks', round: 1, picks: {} },
  gateDrafts: {},
  gateApprovals: {},
};

const store = createStore<JourneySelections>(initialSelections);
function update(patch: (s: JourneySelections) => Partial<JourneySelections>) {
  store.set(patch(store.read()));
}
const without = <T,>(rec: Record<string, T>, key: string) => Object.fromEntries(Object.entries(rec).filter(([k]) => k !== key));

/** Clears every selection (a new visit; tests). */
export function resetJourneyFlow() {
  store.reset();
}

/** Edited facts keep the person's wording; any other decision keeps none. */
const factRecord = (decision: FactDecision, edit?: string): FactRecord =>
  decision === 'edited' ? { decision, edit: edit ?? '' } : { decision };

const actions = {
  /** A new read from Main starts a new journey: every earlier selection is cleared, and the new site is kept. */
  // INTEGRATION: POST /api/brands {website}, then POST /api/brands/:id/sources {url} starts the read (J1).
  startJourney: (site: string) => {
    resetJourneyFlow();
    update(() => ({ site }));
  },
  // INTEGRATION: supabase.auth.signInWithOtp({ email }); the phase moves to 'code' when it resolves.
  sendEmail: (email: string) => update(() => ({ signIn: 'code', emailSentTo: email })),
  changeEmail: () => update(() => ({ signIn: 'email', emailSentTo: '' })),
  // INTEGRATION: PUT /api/brands/:id/sections/:section (edit) and POST …/sections/:section/approve (accept).
  decideFact: (id: string, decision: FactDecision, edit?: string) =>
    update((s) => ({ facts: { ...s.facts, [id]: factRecord(decision, edit) } })),
  undoFact: (id: string) => update((s) => ({ facts: without(s.facts, id) })),
  // INTEGRATION: PUT /api/brands/:id/answers/:step (alternatives, answers and voice picks are interview answers).
  setAlternatives: (selected: string[]) => update(() => ({ alternatives: selected })),
  addAlternative: (option: string) => update((s) => ({ customAlternatives: [...s.customAlternatives, option], alternatives: [...s.alternatives, option] })),
  setAnswer: (id: string, value: string) => update((s) => ({ answers: { ...s.answers, [id]: value } })),
  /**
   * A pick switches the voice to picks mode; a sentence held before is dropped. A new round-one pick clears round two,
   * whose paragraphs were written around the old pick (Codex review on PR #75).
   */
  pickVoice: (round: VoiceRound, value: string) =>
    update((s) => {
      const held = s.voice.mode === 'picks' ? s.voice.picks : {};
      const kept = round === 1 && held[1] !== value ? {} : held;
      return { voice: { mode: 'picks', round, picks: { ...kept, [round]: value } } };
    }),
  setVoiceRound: (round: VoiceRound) => update((s) => ({ voice: { mode: 'picks', round, picks: s.voice.mode === 'picks' ? s.voice.picks : {} } })),
  /** One sentence replaces any picks. */
  setVoiceSentence: (sentence: string) => update(() => ({ voice: { mode: 'sentence', sentence } })),
  // INTEGRATION: PUT /api/brands/:id/sections/:section (edit) and POST …/sections/:section/approve {note} (gate).
  editGate: (id: string, draft: string) => update((s) => ({ gateDrafts: { ...s.gateDrafts, [id]: draft }, gateApprovals: { ...s.gateApprovals, [id]: null } })),
  approveGate: (id: string, decision: GateDecision, fingerprint: string) => update((s) => ({ gateApprovals: { ...s.gateApprovals, [id]: { decision, fingerprint } } })),
  reopenGate: (id: string) => update((s) => ({ gateApprovals: { ...s.gateApprovals, [id]: null } })),
  // INTEGRATION: POST /api/brands/:id/kit/register, and POST /api/registrations/:id/retry after a failure.
  setKitRegistered: (kitRegistered: boolean) => update(() => ({ kitRegistered })),
  setPostChannel: (postChannel: string) => update(() => ({ postChannel })),
  // INTEGRATION: POST /api/brands/:id/posts/:id/approve, then POST …/register (needs kit v1 registered: posts.ts 409).
  approvePost: (post: ApprovedPost) => update(() => ({ post })),
};

export type JourneyActions = { [K in keyof typeof actions]: (...args: Parameters<(typeof actions)[K]>) => void | Promise<void> } & {
  verifyCode?: (code: string) => Promise<void>;
  finishGaps?: () => Promise<void>;
  approveSupportingSection?: (id: string) => Promise<void>;
  resolveConflict?: (id: string, resolution: { mode: 'keep'; keep: string[] } | { mode: 'reject_all' } | { mode: 'answer'; answer: { text: string; value: string } }) => Promise<void>;
  editPost?: (text: string) => Promise<void>;
  polishPost?: (action: string) => Promise<void>;
  undoPost?: () => Promise<void>;
  reviewPost?: () => Promise<void>;
  verifyPost?: (text: string) => Promise<{ official: boolean; note: string }>;

};
export interface JourneyLiveFlow {
  selections: JourneySelections;
  actions: JourneyActions;
  busy?: boolean;
  error?: string;
  status?: string;
}
/** Live routes supply server-backed actions. Gallery routes retain their no-network store. */
export const JourneyFlowContext = createContext<JourneyLiveFlow | null>(null);

/** J4 is finished when both questions are answered and the voice is set: a round 2 pick, or one sentence. */
export const voiceDone = (s: JourneySelections) => {
  const voiceSet = s.voice.mode === 'sentence' ? Boolean(s.voice.sentence.trim()) : Boolean(s.voice.picks[2]);
  return Boolean(s.answers.edge?.trim() && s.answers.origin?.trim() && voiceSet);
};

/** The approval that stands for a gate: one made or reopened this visit wins over the one loaded with the data. */
const approvalOf = (s: JourneySelections, id: string, loaded?: GateApproval): GateApproval | null =>
  id in s.gateApprovals ? s.gateApprovals[id] : loaded ?? null;

const afterKit = journeySteps.findIndex((x) => x.id === 'approveKit');
/** Header chip: the step's own, except after J5 while kit v1 is known not to be registered. */
const kitStatus = (s: JourneySelections, index: number) => (s.kitRegistered === false && index > afterKit ? 'Kit v1 not registered' : journeySteps[index]?.status);

/** Step position and links for a numbered step (J1 to J7); Main and J8 call it without a step for the selections. */
export function useJourneyFlow(step?: JourneyStepId) {
  const previewSelections = store.use()[0];
  const live = useContext(JourneyFlowContext);
  const selections = live?.selections ?? previewSelections;
  const to = useJourneyHref();
  const index = step ? journeySteps.findIndex((s) => s.id === step) : -1;
  const next = journeySteps[index + 1];
  return {
    steps: journeySteps.map((s) => ({ label: s.label })),
    index,
    estimate: journeySteps[index]?.estimate,
    status: live?.status ?? kitStatus(selections, index),
    live: Boolean(live),
    busy: live?.busy ?? false,
    error: live?.error,
    /** The next step, or the first-run hub after the last one. */
    nextHref: to(next?.id ?? 'hub'),
    /** Done steps link back to their screen. */
    stepHref: (i: number): string | undefined => (i < index ? to(journeySteps[i].id) : undefined),
    selections,
    /**
     * The gate decision every screen shows: the approval while its fingerprint still matches the draft's inputs, else
     * pending (stale). One approval model: an approval made this visit and one loaded with the data (the `gates` row)
     * are both `{ decision, fingerprint }` and go stale the same way (Codex review on PR #75).
     */
    gateDecision: (id: string, fingerprint: string, loaded?: GateApproval): GateDecision => {
      const approval = approvalOf(selections, id, loaded);
      return approval && approval.fingerprint === fingerprint ? approval.decision : { status: 'pending' };
    },
    /** True when the gate was approved (this visit or before) and its inputs changed since. */
    gateStale: (id: string, fingerprint: string, loaded?: GateApproval) => {
      const approval = approvalOf(selections, id, loaded);
      return Boolean(approval && approval.fingerprint !== fingerprint);
    },
    actions: (live?.actions ?? actions) as JourneyActions,
  };
}
