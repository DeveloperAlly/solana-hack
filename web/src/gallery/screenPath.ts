import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import type { ScreenState } from '../ui/composites/DemoStateSwitcher';
import type { ArtboardName } from '../config/artboards';

/** Gallery search params that carry over when moving between screens. The state belongs to one screen, so it does not. */
const carried = ['theme'] as const;

/**
 * Path of a gallery screen: /screens/<Artboard>, with the carried params from `current` (the theme) and an optional
 * state. A bare /screens/<Artboard> would reset the theme to the default (Codex review on PR #68).
 */
export function screenPath(artboard: ArtboardName, state?: ScreenState, current?: URLSearchParams): string {
  const params = new URLSearchParams();
  for (const k of carried) {
    const v = current?.get(k);
    if (v) params.set(k, v);
  }
  if (state) params.set('state', state);
  const q = params.toString();
  return `/screens/${encodeURIComponent(artboard)}${q ? `?${q}` : ''}`;
}

/** Returns (artboard, state?) => path that keeps the current gallery theme. Use it for every link between screens. */
export function useScreenHref(): (artboard: ArtboardName, state?: ScreenState) => string {
  const [params] = useSearchParams();
  return useCallback((artboard: ArtboardName, state?: ScreenState) => screenPath(artboard, state, params), [params]);
}
