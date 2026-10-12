import { useId } from 'react';
import { useDisclosure } from '../hooks/useDisclosure';
import styles from './CollapsibleText.module.css';

export interface CollapsibleTextProps {
  text: string;
  /** Collapse to `lines` with a Read more toggle (a mobile brief). Off: the full text, no button. */
  collapsible?: boolean;
  /** Lines shown when collapsed: 2, 3 or 4 (default 4). */
  lines?: 2 | 3 | 4;
  moreLabel?: string;
  lessLabel?: string;
}

/**
 * C33 CollapsibleText: long text that clamps to a few lines with a Read more / Show less toggle (aria-expanded,
 * aria-controls). States: collapsed, expanded. Replaces AmbCollapsibleText (issue #46, shared consolidation).
 */
export function CollapsibleText({ text, collapsible = false, lines = 4, moreLabel = 'Read more', lessLabel = 'Show less' }: CollapsibleTextProps) {
  const { open, toggle } = useDisclosure();
  const id = useId();
  if (!collapsible) return <p className={styles.text}>{text}</p>;
  return (
    <div className={styles.root}>
      <p id={id} className={[styles.text, !open && styles.clamped, !open && styles[`l${lines}`]].filter(Boolean).join(' ')}>{text}</p>
      <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={id} onClick={toggle}>
        {open ? lessLabel : moreLabel}
      </button>
    </div>
  );
}
