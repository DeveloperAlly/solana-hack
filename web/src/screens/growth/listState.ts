import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';

/**
 * The state a list's StateView shows: the demo state while loading or failing, otherwise empty or success from how
 * many items the person's choices leave (so "no platforms chosen" or "no event matches" shows whatever the demo state).
 */
export function listState(state: ScreenState, count: number): ScreenState {
  if (state === 'loading' || state === 'error') return state;
  return count > 0 ? 'success' : 'empty';
}
