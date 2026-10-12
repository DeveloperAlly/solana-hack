import styles from './DiffView.module.css';

/**
 * One changed run of text: del for removed, ins for added. Most screen readers do not announce del and ins,
 * so each carries a visually hidden prefix.
 */
export function DiffMark({ kind, text }: { kind: 'added' | 'removed'; text: string }) {
  const Tag = kind === 'added' ? 'ins' : 'del';
  return (
    <Tag className={styles[kind]}>
      <span className="wl-visually-hidden">[{kind}: </span>
      {text}
      <span className="wl-visually-hidden">]</span>
    </Tag>
  );
}
