// The Brand Builder flow (issue #50): step order, back / next / skip, the three gate decisions and the picks that later
// screens read. One hook for the whole page; screens call it and never hard-code paths or step lists.
// Order and labels: canvas boards Onboard-1 … Onboard-6 and BB-1 … BB-Gate3 (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
// State is held in memory for the session, so it survives moving between /screens routes; nothing is sent anywhere.
// INTEGRATION: gates persist through POST /api/brands/:id/gates/:gate/approve (backend map §4, "Gate 1, Gate 2, Gate 3").
import { useSyncExternalStore } from 'react';
import type { StepperStep } from '../../ui/composites/Stepper';
import { builderPaths, type BuilderPathKey } from './paths';
import type { DialValues, GateDecision, GateId, VoicePick } from './types';

const phase = [
  { label: 'Sign in', path: builderPaths.signIn },
  { label: 'Domain (optional)', path: builderPaths.domain },
  { label: 'Intake 1–6', path: builderPaths.basics },
  { label: 'Coverage', path: builderPaths.coverage },
  { label: 'Kit v1', path: builderPaths.published },
];
const intake = [
  { label: '1 Basics', path: builderPaths.basics },
  { label: '2 Origin', path: builderPaths.origin },
  { label: '3 Purpose', path: builderPaths.goldenCircle },
  { label: '4 Positioning', path: builderPaths.alternatives },
  { label: '5 Audience', path: builderPaths.audience },
  { label: '6 Voice', path: builderPaths.voice },
];
const withSources = [intake[0], { label: 'Sources', path: builderPaths.sources }, ...intake.slice(1)];
const gateLabel = (i: number, gate: number) => intake.map((s, j) => (j === i ? { ...s, label: `${s.label} · Gate ${gate}` } : s));

interface StepConfig {
  steps: { label: string; path: string }[];
  current: number;
  back?: string;
  next?: string;
  skip?: string;
}

type FlowKey = Exclude<BuilderPathKey, 'kitExport' | 'dashboard' | 'dashboardEmpty'>;

const p = builderPaths;
const config: Record<FlowKey, StepConfig> = {
  signIn: { steps: phase, current: 0, next: p.domain },
  domain: { steps: phase, current: 1, back: p.signIn, next: p.domainFailed, skip: p.basics },
  domainFailed: { steps: phase, current: 1, back: p.domain, next: p.basics, skip: p.basics },
  basics: { steps: intake, current: 0, back: p.domain, next: p.sources, skip: p.origin },
  sources: { steps: withSources, current: 1, back: p.basics, next: p.profiling, skip: p.origin },
  profiling: { steps: withSources, current: 1, back: p.sources, next: p.origin },
  ingestError: { steps: withSources, current: 1, back: p.sources, next: p.origin },
  origin: { steps: intake, current: 1, back: p.basics, next: p.goldenCircle, skip: p.goldenCircle },
  goldenCircle: { steps: intake, current: 2, back: p.origin, next: p.gatePurpose, skip: p.gatePurpose },
  gatePurpose: { steps: gateLabel(2, 1), current: 2, back: p.goldenCircle, next: p.alternatives },
  alternatives: { steps: intake, current: 3, back: p.gatePurpose, next: p.gatePositioning, skip: p.gatePositioning },
  gatePositioning: { steps: gateLabel(3, 2), current: 3, back: p.alternatives, next: p.audience },
  audience: { steps: intake, current: 4, back: p.gatePositioning, next: p.voice, skip: p.voice },
  voice: { steps: intake, current: 5, back: p.audience, next: p.gateVoice, skip: p.gateVoice },
  gateVoice: { steps: gateLabel(5, 3), current: 5, back: p.voice, next: p.coverage },
  coverage: { steps: phase, current: 3, back: p.gateVoice, next: p.published },
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
  positioningOption: 'A',
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
  const c = config[key];
  const steps: StepperStep[] = c.steps.map((s) => ({ label: s.label }));
  return {
    steps,
    current: c.current,
    hrefFor: (i: number) => c.steps[i]?.path,
    back: c.back,
    next: c.next,
    skip: c.skip,
    ...flow,
    allGatesApproved: Object.values(flow.gates).every((g) => g.status === 'approved'),
    decide: (gate: GateId, decision: GateDecision) => set({ gates: { ...flow.gates, [gate]: decision } }),
    choosePositioning: (option: string) => set({ positioningOption: option }),
    pickVoice: (voice: VoicePick) => set({ voice }),
    setDials: (dials: DialValues) => set({ dials }),
  };
}

export type BuilderFlow = ReturnType<typeof useBuilderFlow>;
