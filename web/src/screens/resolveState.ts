import type { ScreenState } from '../ui/composites/DemoStateSwitcher';

/**
 * The one precedence rule for the state a screen shows (Codex reviews on PR 111): loading and error always win, as
 * asked; then a data-derived empty (nothing in the data, or nothing a person's filter or pick leaves); then the state
 * asked for. Registries call it with the brand's data; a screen whose emptiness depends on a choice made in it (a
 * filter, a picked post) calls it with that count. No screen derives its state any other way.
 */
export function resolveState(requested: ScreenState, isEmpty: boolean): ScreenState {
  if (requested === 'loading' || requested === 'error') return requested;
  return isEmpty ? 'empty' : requested;
}
