import { useCallback, useRef, type KeyboardEvent } from 'react';

export type RovingOrientation = 'horizontal' | 'vertical';

export interface RovingFocusOptions {
  /** Number of items. */
  count: number;
  /** Arrow keys that move: Left/Right (horizontal, e.g. tabs) or Up/Down (vertical, e.g. menu items). */
  orientation: RovingOrientation;
  /** Items that cannot take focus (e.g. disabled menu items) are skipped. */
  isDisabled?: (index: number) => boolean;
  /** Called with the index that receives focus (Tabs selects it: automatic activation). */
  onMove?: (index: number) => void;
}

/**
 * Keyboard focus that moves between items with the arrow keys, wrapping at the ends, plus Home and End.
 * Shared by C4 Tabs and C16 Menu (WAI-ARIA APG, "Keyboard Navigation Inside Components":
 * https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/).
 */
export function useRovingFocus({ count, orientation, isDisabled = () => false, onMove }: RovingFocusOptions) {
  const refs = useRef<(HTMLElement | null)[]>([]);

  const enabled = useCallback(() => Array.from({ length: count }, (_, i) => i).filter((i) => !isDisabled(i)), [count, isDisabled]);

  const focusAt = useCallback(
    (index: number | undefined) => {
      if (index === undefined) return;
      onMove?.(index);
      refs.current[index]?.focus();
    },
    [onMove],
  );

  const first = useCallback(() => enabled()[0], [enabled]);
  const last = useCallback(() => enabled().at(-1), [enabled]);

  /** Ref setter for item i. */
  const itemRef = useCallback((i: number) => (el: HTMLElement | null) => { refs.current[i] = el; }, []);

  /** Handles Arrow/Home/End on item i; returns true when it handled the key. */
  const onItemKeyDown = useCallback(
    (e: KeyboardEvent, i: number): boolean => {
      const list = enabled();
      if (!list.length) return false;
      const pos = Math.max(0, list.indexOf(i));
      const [prev, next] = orientation === 'horizontal' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
      const target = e.key === next ? list[(pos + 1) % list.length]
        : e.key === prev ? list[(pos - 1 + list.length) % list.length]
        : e.key === 'Home' ? list[0]
        : e.key === 'End' ? list[list.length - 1]
        : undefined;
      if (target === undefined) return false;
      e.preventDefault();
      focusAt(target);
      return true;
    },
    [enabled, orientation, focusAt],
  );

  return { itemRef, onItemKeyDown, focusAt, first, last };
}
