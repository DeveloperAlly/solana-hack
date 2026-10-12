import { useId } from 'react';
import { CopyButton } from '../composites/CopyButton';
import styles from './GrowthEmbedSnippet.module.css';

export interface GrowthEmbedSnippetProps {
  /** Visible label naming the code, e.g. "HTML snippet". */
  label: string;
  /** The code shown and copied. */
  code: string;
  /** Copy button label (default "Copy snippet"). */
  copyLabel?: string;
  /** Secondary line under the code, e.g. where to paste it. */
  hint?: string;
}

/**
 * GrowthEmbedSnippet: a labelled, read-only code block with a copy button (Badge-Embed, issue #82). The code wraps at
 * any character, so a long URL never makes the page scroll sideways on a phone; the block is focusable so keyboard
 * users can select it, and the copy result is announced by C13 CopyButton.
 */
export function GrowthEmbedSnippet({ label, code, copyLabel = 'Copy snippet', hint }: GrowthEmbedSnippetProps) {
  const labelId = useId();
  const hintId = useId();
  return (
    <div className={styles.root}>
      <span id={labelId} className={styles.label}>{label}</span>
      <pre className={styles.code} tabIndex={0} role="region" aria-labelledby={labelId} aria-describedby={hint ? hintId : undefined}>
        <code>{code}</code>
      </pre>
      {hint && <span id={hintId} className={styles.hint}>{hint}</span>}
      <CopyButton value={code} label={copyLabel} />
    </div>
  );
}
