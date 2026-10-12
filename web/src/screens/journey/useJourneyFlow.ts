/*
 * useJourneyFlow: the one place the first-run flow lives (issue #48): the step order, next and back, and every
 * selection the person makes (fact decisions on J3, alternatives, answers and voice picks on J4, gate decisions on J5).
 * Selections sit in a small module store, so they survive moving between the /screens/<Artboard> routes in one visit.
 * Nothing is sent anywhere; each action names the endpoint that will persist it once the flow is wired.
 */
import { useSyncExternalStore } from 'react';
import type { JourneyGateDecision } from '../../ui/domain/JourneyGateCard';
import { journeyPaths, journeySteps, type JourneyStepId } from './paths';
import type { FactDecision } from './types';

export type VoiceRound = 1 | 2;

export interface JourneySelections {
  factDecisions: Record<string, FactDecision>;
  factEdits: Record<string, string>;
  /** Picked alternatives; undefined until the person changes them, so the screen shows the data's defaults. */
  alternatives?: string[];
  customAlternatives: string[];
  answers: Record<string, string>;
  voiceRound: VoiceRound;
  voicePicks: Partial<Record<VoiceRound, string>>;
  voiceSentence: string;
  gateDrafts: Record<string, string>;
  gateDecisions: Record<string, JourneyGateDecision>;
}

const empty: JourneySelections = {
  factDecisions: {},
  factEdits: {},
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

const actions = {
  // INTEGRATION: PUT /api/brands/:id/sections/:section (edit) and POST …/sections/:section/approve (accept).
  decideFact: (id: string, decision: FactDecision, edit?: string) =>
    update((s) => ({ factDecisions: { ...s.factDecisions, [id]: decision }, factEdits: edit === undefined ? s.factEdits : { ...s.factEdits, [id]: edit } })),
  undoFact: (id: string) => update((s) => ({ factDecisions: without(s.factDecisions, id) })),
  // INTEGRATION: PUT /api/brands/:id/answers/:step (alternatives, answers and voice picks are interview answers).
  toggleAlternative: (option: string, defaults: string[]) =>
    update((s) => {
      const current = s.alternatives ?? defaults;
      return { alternatives: current.includes(option) ? current.filter((o) => o !== option) : [...current, option] };
    }),
  addAlternative: (option: string, defaults: string[]) =>
    update((s) => ({ customAlternatives: [...s.customAlternatives, option], alternatives: [...(s.alternatives ?? defaults), option] })),
  setAnswer: (id: string, value: string) => update((s) => ({ answers: { ...s.answers, [id]: value } })),
  pickVoice: (round: VoiceRound, value: string) => update((s) => ({ voicePicks: { ...s.voicePicks, [round]: value } })),
  setVoiceRound: (round: VoiceRound) => update(() => ({ voiceRound: round })),
  setVoiceSentence: (sentence: string) => update(() => ({ voiceSentence: sentence })),
  // INTEGRATION: PUT /api/brands/:id/sections/:section (edit) and POST …/sections/:section/approve {note} (gate).
  editGate: (id: string, draft: string) => update((s) => ({ gateDrafts: { ...s.gateDrafts, [id]: draft }, gateDecisions: without(s.gateDecisions, id) })),
  approveGate: (id: string, decision: JourneyGateDecision) => update((s) => ({ gateDecisions: { ...s.gateDecisions, [id]: decision } })),
  reopenGate: (id: string) => update((s) => ({ gateDecisions: without(s.gateDecisions, id) })),
};

export type JourneyActions = typeof actions;

/** Step position and links for a numbered step (J1 to J7); Main and J8 call it without a step for the selections. */
export function useJourneyFlow(step?: JourneyStepId) {
  const selections = useSyncExternalStore(subscribe, snapshot, snapshot);
  const index = step ? journeySteps.findIndex((s) => s.id === step) : -1;
  const last = journeySteps.length - 1;
  return {
    steps: journeySteps.map((s) => ({ label: s.label })),
    index,
    estimate: journeySteps[index]?.estimate,
    nextHref: index >= 0 && index < last ? journeySteps[index + 1].path : journeyPaths.hub,
    backHref: index > 0 ? journeySteps[index - 1].path : journeyPaths.main,
    /** Done steps link back to their screen. */
    stepHref: (i: number): string | undefined => (i < index ? journeySteps[i].path : undefined),
    selections,
    actions,
  };
}
