// The current Brain version, the one input every Brain-derived approval is fingerprinted with (Codex review on PR 102;
// ADR-012 decision 4: approvals bound to an older Brain go stale). It comes from the shared loop store, which a rule
// approved or retired bumps (useLoop), and falls back to the Brain fixture's version until a change is made.
// INTEGRATION: X18 brand memory (ADR-013) serves the version; the fixture goes.
import { adnaBrain } from '../../domain/fixtures/brain';
import { loopStore } from './store';

export const baseBrainVersion = adnaBrain.version;

/** The Brain version now, outside React (stamping an approval in an event handler). */
export const currentBrainVersion = (): string => loopStore.read().brainVersion ?? baseBrainVersion;

/** The Brain version now; re-renders when a rule change bumps it. */
export function useBrainVersion(): string {
  const [state] = loopStore.use();
  return state.brainVersion ?? baseBrainVersion;
}
