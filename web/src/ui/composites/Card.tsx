import type { ElementType, ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import styles from './Card.module.css';

export type CardVariant = 'default' | 'subtle' | 'selected' | 'dashed' | 'emphasis';

export interface CardProps {
  variant?: CardVariant;
  /** Element for the card body: section (default), article, div or li. */
  as?: ElementType;
  header?: ReactNode;
  footer?: ReactNode;
  /** Makes the whole card a link (hover state). Keep link cards free of other interactive content. */
  href?: string;
  /** Runs before a link card navigates (e.g. to record what the next screen should open on). */
  onClick?: () => void;
  /** Accessible name for a section card; pass the id of its heading. */
  labelledBy?: string;
  children?: ReactNode;
}

/** C1 Card: default, subtle, selected, dashed (empty) or emphasis (error); optional header and footer; can be a link. */
export function Card({ variant = 'default', as = 'section', header, footer, href, onClick, labelledBy, children }: CardProps) {
  const cls = [styles.card, styles[variant], href && styles.link].filter(Boolean).join(' ');
  const body = (
    <>
      {header && <div className={styles.header}>{header}</div>}
      {children}
      {footer && <div className={styles.footer}>{footer}</div>}
    </>
  );
  if (href) {
    return (
      <RouterLink to={href} className={cls} onClick={onClick}>
        {body}
      </RouterLink>
    );
  }
  const As = as;
  return (
    <As className={cls} aria-labelledby={labelledBy}>
      {body}
    </As>
  );
}
