import { useId, useState } from 'react';
import styles from './AmbCollapsibleText.module.css';

export interface AmbCollapsibleTextProps {
  text: string;
  /** Collapse to four lines with "Read more" (mobile brief, canvas note n-m2). Off: the full text, no button. */
  collapsible?: boolean;
}

/** Long text that collapses after four lines on mobile, with a Read more / Show less toggle. States: collapsed, expanded. */
export function AmbCollapsibleText({ text, collapsible = false }: AmbCollapsibleTextProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!collapsible) return <p className={styles.text}>{text}</p>;
  return (
    <div className={styles.root}>
      <p id={id} className={`${styles.text} ${open ? '' : styles.clamped}`}>{text}</p>
      <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        {open ? 'Show less' : 'Read more'}
      </button>
    </div>
  );
}
