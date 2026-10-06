import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import styles from './Text.module.css';

export type TextVariant = 'body' | 'small' | 'caption' | 'label' | 'mono';
export type TextTone = 'primary' | 'secondary' | 'inverse' | 'success' | 'warning' | 'danger' | 'info';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: TextVariant;
  tone?: TextTone;
  truncate?: boolean;
  children?: ReactNode;
}

/** P5 Text. */
export function Text({ as: As = 'p', variant = 'body', tone = 'primary', truncate = false, className, ...rest }: TextProps) {
  const cls = [styles.text, styles[variant], styles[`tone-${tone}`], truncate && styles.truncate, className].filter(Boolean).join(' ');
  return <As {...rest} className={cls} />;
}
