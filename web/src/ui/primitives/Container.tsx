import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import styles from './Container.module.css';

export type ContainerWidth = 'reading' | 'wizard' | 'app' | 'full';

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  width?: ContainerWidth;
  children?: ReactNode;
}

/** P4 Container: centred content with a token max width and page padding. */
export function Container({ as: As = 'div', width = 'app', className, ...rest }: ContainerProps) {
  return <As {...rest} className={[styles.container, styles[width], className].filter(Boolean).join(' ')} />;
}
