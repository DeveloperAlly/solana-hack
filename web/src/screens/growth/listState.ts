import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { resolveState } from '../resolveState';

/**
 * The state a list's StateView shows: the demo state while loading or failing, otherwise empty or success from how
 * many items the person's choices leave (so "no platforms chosen" or "no event matches" shows whatever the demo state).
 */
export function listState(state: ScreenState, count: number): ScreenState {
  return resolveState(state === 'empty' ? 'success' : state, count === 0);
}

/**
 * Whether the screen's data is in hand, so controls that act on it may show (Codex review on PR 102: nothing is
 * actionable while loading). `error` means the data did not load, unless the screen's error is about something else
 * with its data in hand (a disconnected source, a failed publish, a cancelled event): pass `errorKeepsData`.
 */
export function dataLoaded(state: ScreenState, errorKeepsData = false): boolean {
  if (state === 'loading') return false;
  return state !== 'error' || errorKeepsData;
}
