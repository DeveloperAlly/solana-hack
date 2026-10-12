import { Text } from '../primitives/Text';
import { DiffMark } from './DiffMark';
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

/** Renders segments as one paragraph, leaving out one kind (split view) or none (inline). */
function DiffText({ segments, omit }: { segments: DiffSegment[]; omit?: 'added' | 'removed' }) {
  return (
    <p className={styles.text}>
      {segments.filter((s) => s.kind !== omit).map((s, i) => (s.kind === 'same' ? <span key={i}>{s.text}</span> : <DiffMark key={i} kind={s.kind} text={s.text} />))}
    </p>
  );
}

/** C23 DiffView: inline (del / ins) or side by side; used for slop fixes, polish actions and Verify "edited". */
export function DiffView({ segments, mode = 'inline', beforeLabel = 'Before', afterLabel = 'After' }: DiffViewProps) {
  if (mode === 'inline') return <DiffText segments={segments} />;
  return (
    <div className={styles.split}>
      <div className={`${styles.pane} ${styles.before}`}>
        <Text variant="label" as="p">{beforeLabel}</Text>
        <DiffText segments={segments} omit="added" />
      </div>
      <div className={styles.pane}>
        <Text variant="label" as="p">{afterLabel}</Text>
        <DiffText segments={segments} omit="removed" />
      </div>
    </div>
  );
}
