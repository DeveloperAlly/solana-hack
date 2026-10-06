import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Heading.module.css';

export type HeadingLevel = 1 | 2 | 3 | 4;
export type HeadingSize = 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
const defaultSize: Record<HeadingLevel, HeadingSize> = { 1: '3xl', 2: '2xl', 3: 'xl', 4: 'lg' };

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  /** Visual size, independent of level. */
  size?: HeadingSize;
  children?: ReactNode;
}

/** P6 Heading. */
export function Heading({ level = 2, size, className, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  return <Tag {...rest} className={[styles.heading, styles[`size-${size ?? defaultSize[level]}`], className].filter(Boolean).join(' ')} />;
}
