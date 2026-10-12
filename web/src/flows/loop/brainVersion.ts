// The current Brain version, the one input every Brain-derived approval is fingerprinted with (Codex review on PR 102;
// ADR-012 decision 4: approvals bound to an older Brain go stale). It comes from the shared loop store, which a rule
// approved or retired bumps (useLoop), and falls back to the active brand's Brain fixture version until a change is
// made; both are per brand (the loop store is brand-scoped; Codex review on PR 111).
// INTEGRATION: X18 brand memory (ADR-013) serves the version; the fixture goes.
import { brainFor } from '../../domain/fixtures/brain';
import { activeBrand } from '../brand/activeBrand';
import { loopStore } from './store';

/** The fixture Brain version of a brand; "0" for a brand with no Brain yet. */
export const baseBrainVersionFor = (brandId: string): string => brainFor(brandId)?.version ?? '0';

/** The Brain version now, outside React (stamping an approval in an event handler). */
export const currentBrainVersion = (): string => loopStore.read().brainVersion ?? baseBrainVersionFor(activeBrand.read());

/** The Brain version now; re-renders when a rule change bumps it. */
export function useBrainVersion(): string {
  // Both hooks run on every render, in the same order: never behind ?? or && (Codex review on PR 111).
  const [state] = loopStore.use();
  const brandId = activeBrand.use();
  return state.brainVersion ?? baseBrainVersionFor(brandId);
}
