// The Brand Builder flow (issue #50): step order, back / next / skip, the three gate decisions and the picks that later
// screens read. One hook for the whole page; screens call it and never hard-code paths or step lists. Hrefs come from
// the board map in ./paths and keep the gallery theme.
// Order and labels: canvas boards Onboard-1 … Onboard-6 and BB-1 … BB-Gate3 (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
// State is held in memory for the session, so it survives moving between /screens routes; nothing is sent anywhere.
// INTEGRATION: gates persist through POST /api/brands/:id/gates/:gate/approve (backend map §4, "Gate 1, Gate 2, Gate 3").
import { createStore } from '../../lib/createStore';
import { activeBrand, selectBrand, useActiveBrandId } from '../../flows/brand/activeBrand';
import type { StepperStep } from '../../ui/composites/Stepper';
import { useBoardHref, type BoardKey } from './paths';
import type { BuilderBrand, DialValues, GateDecision, GateId, VoicePick } from './types';

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

/** What the owner entered about the brand and its domain; unset fields fall back to the screen's fixtures. */
export interface BrandEntry {
  brandName?: string;
  domain?: string;
  /** Set by a successful domain check (true) or by skipping it (false). */
  verified?: boolean;
}

/**
 * Merges an edit into the brand entry. A changed domain always resets verification (it must be checked again), unless
 * the same edit sets verified itself; this is the only place brand entries change, so no screen can skip it.
 */
export function applyBrandEntry(prev: BrandEntry, entry: BrandEntry): BrandEntry {
  const next = { ...prev, ...entry };
  if (entry.domain !== undefined && entry.domain !== prev.domain && entry.verified === undefined) next.verified = false;
  return next;
}

export interface FlowState {
  brand: BrandEntry;
  /** The signed-in email (sign-in), recorded as the approver on gates and the kit. */
  email?: string;
  /** Links entered on Basics, one per line. */
  links?: string;
  /** Sources chosen on the Sources step, in order. */
  sources?: string[];
  /** The kit version Kit-Export opens on, and the brand it belongs to (set when coming from the kit just published). */
  exportFor?: { brand: string; version: string };
  /** Gate decisions as recorded; an approval keeps a fingerprint of the inputs it approved (see gateInputs). */
  gates: Record<GateId, StoredDecision>;
  positioningOption: string;
  voice: VoicePick;
  dials: DialValues;
}

const initial: FlowState = {
  brand: {},
  gates: { purpose: { status: 'pending' }, positioning: { status: 'pending' }, voice: { status: 'pending' } },
  positioningOption: '',
  voice: { round1: 'B', round2: 'C' },
  dials: { formality: 2, energy: 3, humour: 2 },
};

const store = createStore<FlowState>(initial);
const set = store.set;

/** Clears the flow (tests, and "start again"): replaced whole, so optional fields (email, links, hub brand) go too. */
export const resetBuilderFlow = store.reset;

/** A gate decision as stored: an approval also keeps the fingerprint of the flow inputs it approved. */
export type StoredDecision = GateDecision & { inputs?: string };

/** The gates in dependency order: each is drafted from the ones before it (brand_builder_architecture.md, "Gates"). */
export const gateOrder: readonly GateId[] = ['purpose', 'positioning', 'voice'];

/**
 * The fingerprint of what a gate's draft is built from: its own flow inputs plus the fingerprint of the gate upstream of
 * it, so one dependency chain makes every downstream approval stale (Codex review on PR #73: Voice sits downstream of
 * Positioning). Own inputs: Purpose, the brand name (its answers are not held in the flow); Positioning, the BB-4
 * option; Voice, the BB-6 picks and dials.
 */
export function gateInputs(s: Pick<FlowState, 'brand' | 'positioningOption' | 'voice' | 'dials'>, gate: GateId): string {
  const own: Record<GateId, unknown> = {
    purpose: [s.brand.brandName ?? ''],
    positioning: [s.positioningOption],
    voice: [s.voice.round1, s.voice.round2, s.dials.formality, s.dials.energy, s.dials.humour],
  };
  const upstream = gateOrder[gateOrder.indexOf(gate) - 1];
  return JSON.stringify([own[gate], upstream ? gateInputs(s, upstream) : null]);
}

/** Records a decision; an approval is bound to the inputs it approved. */
export function recordDecision(s: FlowState, gate: GateId, decision: GateDecision): Record<GateId, StoredDecision> {
  const stored: StoredDecision = decision.status === 'approved' ? { ...decision, inputs: gateInputs(s, gate) } : decision;
  return { ...s.gates, [gate]: stored };
}

/** Decisions as they stand now: an approval whose inputs changed since is stale (D17's stale state) and must be re-approved. */
export function effectiveGates(s: FlowState): Record<GateId, GateDecision> {
  const out = {} as Record<GateId, GateDecision>;
  for (const g of Object.keys(s.gates) as GateId[]) {
    const { inputs, ...d } = s.gates[g];
    out[g] = d.status === 'approved' && inputs !== undefined && inputs !== gateInputs(s, g) ? { ...d, status: 'stale' } : d;
  }
  return out;
}

/** The gates that still block kit v1 (note n-g1.3: kit v1 needs all three approved); stale approvals count as open. */
export function openGates(gates: Record<GateId, GateDecision>): GateId[] {
  return (Object.keys(gates) as GateId[]).filter((g) => gates[g].status !== 'approved');
}

export function useBuilderFlow(key: FlowKey) {
  const flow = store.use()[0];
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
    /** Decisions with staleness applied (what every screen shows). */
    gates: effectiveGates(flow),
    /** The brand as entered in this flow, over the fixture brand: name and verified status (Unverified flag). */
    brandFor: (fixture: BuilderBrand): BuilderBrand => ({
      id: fixture.id,
      name: flow.brand.brandName ?? fixture.name,
      verified: flow.brand.verified ?? fixture.verified,
      approver: flow.email ?? fixture.approver,
    }),
    enterBrand: (entry: BrandEntry) => set({ brand: applyBrandEntry(flow.brand, entry) }),
    signIn: (email: string) => set({ email }),
    enterLinks: (links: string) => set({ links }),
    chooseSources: (sources: string[]) => set({ sources }),
    /** Open Kit-Export on this brand and version (the kit just published). */
    openExport: (brandId: string, version: string) => {
      selectBrand(brandId);
      set({ exportFor: { brand: brandId, version } });
    },
    /** Gates not yet approved. The Coverage-Map alert and the kit approval block both read this, never a second check. */
    openGates: openGates(effectiveGates(flow)),
    decide: (gate: GateId, decision: GateDecision) => set({ gates: recordDecision(flow, gate, decision) }),
    choosePositioning: (option: string) => set({ positioningOption: option }),
    pickVoice: (voice: VoicePick) => set({ voice }),
    setDials: (dials: DialValues) => set({ dials }),
  };
}

export type BuilderFlow = ReturnType<typeof useBuilderFlow>;

/**
 * The hub brand switcher's selection (Kit-Export, Dashboard): [active brand id, choose]. The brand is the app-wide one
 * (flows/brand/activeBrand), so every page's switcher agrees.
 */
export function useHubBrand(): [string, (id: string) => void] {
  return useActiveBrandId();
}

/** The kit version Kit-Export should open on, if one was chosen upstream. */
export function useExportVersion(): string | undefined {
  const pick = store.use()[0].exportFor;
  // A version picked for one brand never opens under another.
  return pick && pick.brand === activeBrand.use() ? pick.version : undefined;
}
