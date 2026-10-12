/*
 * useJourneyFlow: the one place the first-run flow lives (issue #48): the step order, next and back, whether each step
 * is finished, and every selection the person makes (sign-in on J2, fact decisions on J3,
 * alternatives, answers and voice picks on J4, gate decisions on J5). Selections sit in a small module store, so they
 * survive moving between the /screens/<Artboard> routes in one visit. Nothing is preselected and nothing is sent; each
 * action names the endpoint that will persist it once the flow is wired.
 */
import { useSyncExternalStore } from 'react';
import type { JourneyGateDecision } from '../../ui/domain/JourneyGateCard';
import { journeySteps, useJourneyHref, type JourneyStepId } from './paths';
import type { FactDecision, FactRecord } from './types';

export type VoiceRound = 1 | 2;

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
  voiceRound: VoiceRound;
  voicePicks: Partial<Record<VoiceRound, string>>;
  voiceSentence: string;
  gateDrafts: Record<string, string>;
  /** A decision per gate; null means reopened, which hides a decision that came with the data. */
  gateDecisions: Record<string, JourneyGateDecision | null>;
  /** Whether kit v1 reached Solana: true after J5 registers it, false after a retry fails, undefined before J5. */
  kitRegistered?: boolean;
  /** The channel tab chosen on J6. */
  postChannel?: string;
  post?: ApprovedPost;
}

const empty: JourneySelections = {
  site: '',
  signIn: 'email',
  emailSentTo: '',
  facts: {},
  alternatives: [],
  customAlternatives: [],
  answers: {},
  voiceRound: 1,
  voicePicks: {},
  voiceSentence: '',
  gateDrafts: {},
  gateDecisions: {},
};

let state: JourneySelections = empty;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = () => state;
function update(patch: (s: JourneySelections) => Partial<JourneySelections>) {
  state = { ...state, ...patch(state) };
  listeners.forEach((l) => l());
}
const without = <T,>(rec: Record<string, T>, key: string) => Object.fromEntries(Object.entries(rec).filter(([k]) => k !== key));

/** Clears every selection (a new visit; tests). */
export function resetJourneyFlow() {
  state = empty;
  listeners.forEach((l) => l());
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
  pickVoice: (round: VoiceRound, value: string) => update((s) => ({ voicePicks: { ...s.voicePicks, [round]: value } })),
  setVoiceRound: (round: VoiceRound) => update(() => ({ voiceRound: round })),
  setVoiceSentence: (sentence: string) => update(() => ({ voiceSentence: sentence })),
  // INTEGRATION: PUT /api/brands/:id/sections/:section (edit) and POST …/sections/:section/approve {note} (gate).
  editGate: (id: string, draft: string) => update((s) => ({ gateDrafts: { ...s.gateDrafts, [id]: draft }, gateDecisions: { ...s.gateDecisions, [id]: null } })),
  approveGate: (id: string, decision: JourneyGateDecision) => update((s) => ({ gateDecisions: { ...s.gateDecisions, [id]: decision } })),
  reopenGate: (id: string) => update((s) => ({ gateDecisions: { ...s.gateDecisions, [id]: null } })),
  // INTEGRATION: POST /api/brands/:id/kit/register, and POST /api/registrations/:id/retry after a failure.
  setKitRegistered: (kitRegistered: boolean) => update(() => ({ kitRegistered })),
  setPostChannel: (postChannel: string) => update(() => ({ postChannel })),
  // INTEGRATION: POST /api/brands/:id/posts/:id/approve, then POST …/register (needs kit v1 registered: posts.ts 409).
  approvePost: (post: ApprovedPost) => update(() => ({ post })),
};

export type JourneyActions = typeof actions;

/** J4 is finished when both questions are answered and the voice is set: a round 2 pick, or one sentence. */
export const voiceDone = (s: JourneySelections) =>
  Boolean(s.answers.edge?.trim() && s.answers.origin?.trim() && (s.voicePicks[2] || s.voiceSentence.trim()));

const afterKit = journeySteps.findIndex((x) => x.id === 'approveKit');
/** Header chip: the step's own, except after J5 while kit v1 is known not to be registered. */
const kitStatus = (s: JourneySelections, index: number) => (s.kitRegistered === false && index > afterKit ? 'Kit v1 not registered' : journeySteps[index]?.status);

/** Step position and links for a numbered step (J1 to J7); Main and J8 call it without a step for the selections. */
export function useJourneyFlow(step?: JourneyStepId) {
  const selections = useSyncExternalStore(subscribe, snapshot, snapshot);
  const to = useJourneyHref();
  const index = step ? journeySteps.findIndex((s) => s.id === step) : -1;
  const next = journeySteps[index + 1];
  return {
    steps: journeySteps.map((s) => ({ label: s.label })),
    index,
    estimate: journeySteps[index]?.estimate,
    status: kitStatus(selections, index),
    /** The next step, or the first-run hub after the last one. */
    nextHref: to(next?.id ?? 'hub'),
    /** Done steps link back to their screen. */
    stepHref: (i: number): string | undefined => (i < index ? to(journeySteps[i].id) : undefined),
    selections,
    /** The gate decision to show: the person's own this visit, else the one that came with the data (the `gates` row). */
    gateDecision: (id: string, fromData?: JourneyGateDecision) => (id in selections.gateDecisions ? selections.gateDecisions[id] ?? undefined : fromData),
    actions,
  };
}
