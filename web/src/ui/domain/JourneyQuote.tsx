import type { ReactNode } from 'react';
import styles from './JourneyQuote.module.css';

export type JourneyQuoteSize = 'sm' | 'xs';

export interface JourneyQuoteProps {
  /** The exact line, without quote marks (they are added). */
  children: ReactNode;
  size?: JourneyQuoteSize;
}

/** JourneyQuote: the exact supporting line for a fact, set off with a rule (canvas `.quote`, boards Main, J1, J3, J6; issue #48). */
export function JourneyQuote({ children, size = 'sm' }: JourneyQuoteProps) {
  return <blockquote className={`${styles.quote} ${styles[size]}`}>&ldquo;{children}&rdquo;</blockquote>;
}
