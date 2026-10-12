import type { ReactNode } from 'react';
import { Text } from '../primitives/Text';
import styles from './DiffView.module.css';

export interface DiffSegment {
  kind: 'same' | 'added' | 'removed';
  text: string;
}

export interface DiffViewProps {
  segments: DiffSegment[];
  /** inline: one text with del / ins; split: before and after side by side. */
  mode?: 'inline' | 'split';
  beforeLabel?: string;
  afterLabel?: string;
}

// del and ins are not announced by most screen readers, so each change carries a visually hidden prefix.
function Removed({ children }: { children: ReactNode }) {
  return <del className={styles.removed}><span className="wl-visually-hidden">[removed: </span>{children}<span className="wl-visually-hidden">]</span></del>;
}
function Added({ children }: { children: ReactNode }) {
  return <ins className={styles.added}><span className="wl-visually-hidden">[added: </span>{children}<span className="wl-visually-hidden">]</span></ins>;
}

/** C23 DiffView: inline (del / ins) or side by side; used for slop fixes, polish actions and Verify "edited". */
export function DiffView({ segments, mode = 'inline', beforeLabel = 'Before', afterLabel = 'After' }: DiffViewProps) {
  if (mode === 'inline') {
    return (
      <p className={styles.text}>
        {segments.map((s, i) => (s.kind === 'same' ? <span key={i}>{s.text}</span> : s.kind === 'added' ? <Added key={i}>{s.text}</Added> : <Removed key={i}>{s.text}</Removed>))}
      </p>
    );
  }
  return (
    <div className={styles.split}>
      <div className={`${styles.pane} ${styles.before}`}>
        <Text variant="label" as="p">{beforeLabel}</Text>
        <p className={styles.text}>{segments.filter((s) => s.kind !== 'added').map((s, i) => (s.kind === 'removed' ? <Removed key={i}>{s.text}</Removed> : <span key={i}>{s.text}</span>))}</p>
      </div>
      <div className={styles.pane}>
        <Text variant="label" as="p">{afterLabel}</Text>
        <p className={styles.text}>{segments.filter((s) => s.kind !== 'removed').map((s, i) => (s.kind === 'added' ? <Added key={i}>{s.text}</Added> : <span key={i}>{s.text}</span>))}</p>
      </div>
    </div>
  );
}
