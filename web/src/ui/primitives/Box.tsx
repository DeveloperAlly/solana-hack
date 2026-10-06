import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { space, type SpaceStep } from './types';

export type BoxBackground = 'none' | 'canvas' | 'surface' | 'subtle' | 'inverse';
export type BoxBorder = 'none' | 'default' | 'strong' | 'subtle';
export type BoxRadius = 'none' | 'box' | 'control' | 'pill';

export interface BoxProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  padding?: SpaceStep;
  paddingX?: SpaceStep;
  paddingY?: SpaceStep;
  background?: BoxBackground;
  border?: BoxBorder;
  radius?: BoxRadius;
  children?: ReactNode;
}

/** P1 Box: a polymorphic element with padding, background, border and radius from tokens. */
export function Box({ as: As = 'div', padding, paddingX, paddingY, background = 'none', border = 'none', radius = 'none', style, ...rest }: BoxProps) {
  return (
    <As
      {...rest}
      style={{
        padding: space(padding),
        paddingInline: space(paddingX),
        paddingBlock: space(paddingY),
        background: background === 'none' ? undefined : `var(--wl-bg-${background})`,
        border: border === 'none' ? undefined : `var(--wl-border-width-default) solid var(--wl-border-${border})`,
        borderRadius: radius === 'none' ? undefined : `var(--wl-radius-${radius})`,
        ...style,
      }}
    />
  );
}
