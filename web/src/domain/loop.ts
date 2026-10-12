// Where a brand is in the loop (ADR-012 decisions 1 and 6; canvas v25 boards Today and M-Today). Progress is a count
// of live steps, not a position, because steps go live out of order: after the first run Brand, Create and Verify are
// live while Distribute is not, which reads "3 of 6 steps live".

/** A loop step is live (running), current (live, and where the work is now) or not started (it teaches). */
export type LoopStepState = 'live' | 'current' | 'not-started';

/** How many steps are live: every step that has started, the current one included. */
export const liveStepCount = (states: readonly LoopStepState[]): number => states.filter((s) => s !== 'not-started').length;

/** "5 of 6 steps live". */
export const loopProgressLabel = (states: readonly LoopStepState[]): string => `${liveStepCount(states)} of ${states.length} steps live`;
