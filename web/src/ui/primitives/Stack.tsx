import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { space, type SpaceStep } from './types';

export interface StackProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  direction?: 'row' | 'column';
  gap?: SpaceStep;
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between';
  wrap?: boolean;
  children?: ReactNode;
}

const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' } as const;
const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch', baseline: 'baseline' } as const;

/** P2 Stack: flex layout with token gaps. */
export function Stack({ as: As = 'div', direction = 'column', gap = 4, align = 'stretch', justify = 'start', wrap = false, style, ...rest }: StackProps) {
  return (
    <As
      {...rest}
      style={{
        display: 'flex',
        flexDirection: direction,
        gap: space(gap),
        alignItems: alignMap[align],
        justifyContent: justifyMap[justify],
        flexWrap: wrap ? 'wrap' : 'nowrap',
        ...style,
      }}
    />
  );
}
