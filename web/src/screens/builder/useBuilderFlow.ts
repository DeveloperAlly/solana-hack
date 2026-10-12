// The Brand Builder flow (issue #50): step order, back / next / skip, the three gate decisions and the picks that later
// screens read. One hook for the whole page; screens call it and never hard-code paths or step lists. Hrefs come from
// the board map in ./paths and keep the gallery theme.
// Order and labels: canvas boards Onboard-1 … Onboard-6 and BB-1 … BB-Gate3 (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
// State is held in memory for the session, so it survives moving between /screens routes; nothing is sent anywhere.
// INTEGRATION: gates persist through POST /api/brands/:id/gates/:gate/approve (backend map §4, "Gate 1, Gate 2, Gate 3").
import { useSyncExternalStore } from 'react';
import type { StepperStep } from '../../ui/composites/Stepper';
import { useBoardHref, type BoardKey } from './paths';
import type { DialValues, GateDecision, GateId, VoicePick } from './types';

interface Step {
  label: string;
  board: BoardKey;
}

const phase: Step[] = [
  { label: 'Sign in', board: 'signIn' },
  { label: 'Domain (optional)', board: 'domain' },
  { label: 'Intake 1–6', board: 'basics' },
  { label: 'Coverage', board: 'coverage' },
  { label: 'Kit v1', board: 'published' },
];
const intake: Step[] = [
  { label: '1 Basics', board: 'basics' },
  { label: '2 Origin', board: 'origin' },
  { label: '3 Purpose', board: 'goldenCircle' },
  { label: '4 Positioning', board: 'alternatives' },
  { label: '5 Audience', board: 'audience' },
  { label: '6 Voice', board: 'voice' },
];
const withSources: Step[] = [intake[0], { label: 'Sources', board: 'sources' }, ...intake.slice(1)];
const gateLabel = (i: number, gate: number) => intake.map((s, j) => (j === i ? { ...s, label: `${s.label} · Gate ${gate}` } : s));

interface StepConfig {
  steps: Step[];
  current: number;
  back?: BoardKey;
  next?: BoardKey;
  skip?: BoardKey;
}

export type FlowKey = 'signIn' | 'domain' | 'domainFailed' | 'basics' | 'sources' | 'profiling' | 'ingestError' | 'origin' | 'goldenCircle'
  | 'gatePurpose' | 'alternatives' | 'gatePositioning' | 'audience' | 'voice' | 'gateVoice' | 'coverage' | 'published' | 'registerFailed';

const config: Record<FlowKey, StepConfig> = {
  signIn: { steps: phase, current: 0, next: 'domain' },
  domain: { steps: phase, current: 1, back: 'signIn', next: 'domainFailed', skip: 'basics' },
  domainFailed: { steps: phase, current: 1, back: 'domain', next: 'basics', skip: 'basics' },
  basics: { steps: intake, current: 0, back: 'domain', next: 'sources', skip: 'origin' },
  sources: { steps: withSources, current: 1, back: 'basics', next: 'profiling', skip: 'origin' },
  profiling: { steps: withSources, current: 1, back: 'sources', next: 'origin' },
  ingestError: { steps: withSources, current: 1, back: 'sources', next: 'origin' },
  origin: { steps: intake, current: 1, back: 'basics', next: 'goldenCircle', skip: 'goldenCircle' },
  goldenCircle: { steps: intake, current: 2, back: 'origin', next: 'gatePurpose', skip: 'gatePurpose' },
  gatePurpose: { steps: gateLabel(2, 1), current: 2, back: 'goldenCircle', next: 'alternatives' },
  alternatives: { steps: intake, current: 3, back: 'gatePurpose', next: 'gatePositioning', skip: 'gatePositioning' },
  gatePositioning: { steps: gateLabel(3, 2), current: 3, back: 'alternatives', next: 'audience' },
  audience: { steps: intake, current: 4, back: 'gatePositioning', next: 'voice', skip: 'voice' },
  voice: { steps: intake, current: 5, back: 'audience', next: 'gateVoice', skip: 'gateVoice' },
  gateVoice: { steps: gateLabel(5, 3), current: 5, back: 'voice', next: 'coverage' },
  coverage: { steps: phase, current: 3, back: 'gateVoice', next: 'published' },
  published: { steps: phase, current: 4 },
  registerFailed: { steps: phase, current: 4 },
};

export interface FlowState {
  gates: Record<GateId, GateDecision>;
  positioningOption: string;
  voice: VoicePick;
  dials: DialValues;
}

const initial: FlowState = {
  gates: { purpose: { status: 'pending' }, positioning: { status: 'pending' }, voice: { status: 'pending' } },
  positioningOption: '',
  voice: { round1: 'B', round2: 'C' },
  dials: { formality: 2, energy: 3, humour: 2 },
};

let state: FlowState = initial;
const listeners = new Set<() => void>();
function set(next: Partial<FlowState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Clears the flow (tests, and "start again"). */
export function resetBuilderFlow() {
  set(initial);
}

export function useBuilderFlow(key: FlowKey) {
  const flow = useSyncExternalStore(subscribe, () => state);
  const to = useBoardHref();
  const c = config[key];
  const href = (board?: BoardKey) => (board ? to(board) : undefined);
  const steps: StepperStep[] = c.steps.map((s) => ({ label: s.label }));
  return {
    steps,
    current: c.current,
    hrefFor: (i: number) => href(c.steps[i]?.board),
    back: href(c.back),
    next: href(c.next),
    skip: href(c.skip),
    ...flow,
    allGatesApproved: Object.values(flow.gates).every((g) => g.status === 'approved'),
    decide: (gate: GateId, decision: GateDecision) => set({ gates: { ...flow.gates, [gate]: decision } }),
    choosePositioning: (option: string) => set({ positioningOption: option }),
    pickVoice: (voice: VoicePick) => set({ voice }),
    setDials: (dials: DialValues) => set({ dials }),
  };
}

export type BuilderFlow = ReturnType<typeof useBuilderFlow>;
