import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { space, type SpaceStep } from './types';

export type GridMin = 'sm' | 'md' | 'lg';
// Minimum column widths from space tokens; columns wrap to one per row on narrow screens.
const minWidth: Record<GridMin, string> = {
  sm: 'calc(var(--wl-space-12) * 4)',
  md: 'calc(var(--wl-space-12) * 5)',
  lg: 'calc(var(--wl-space-12) * 7)',
};

export interface GridProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  min?: GridMin;
  gap?: SpaceStep;
  children?: ReactNode;
}

/** P9 Grid: responsive auto-fit columns with a token minimum width. */
export function Grid({ as: As = 'div', min = 'md', gap = 5, style, className, ...rest }: GridProps) {
  return (
    <As
      {...rest}
      className={[As === 'ul' || As === 'ol' ? 'wl-list' : null, className].filter(Boolean).join(' ') || undefined}
      style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${minWidth[min]}), 1fr))`, gap: space(gap), ...style }}
    />
  );
}
