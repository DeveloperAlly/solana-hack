import { useId, type ReactNode } from 'react';
import styles from './AmbDraftEditor.module.css';

export interface AmbDraftEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Phrases flagged by the checks; they are highlighted wherever they appear in the text. */
  highlights?: string[];
  /** Per-channel character limit; the count turns to an error over it. */
  charLimit?: number;
  /** Generating a draft: a skeleton replaces the text (canvas note n-a3, about 10 s). */
  generating?: boolean;
  /** Controls for the toolbar row (Undo, History). */
  toolbar?: ReactNode;
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Splits text into plain and flagged runs, case-insensitively. */
export function highlightRuns(text: string, phrases: string[]): { text: string; flagged: boolean }[] {
  const live = phrases.filter(Boolean);
  if (live.length === 0) return [{ text, flagged: false }];
  const re = new RegExp(`(${live.map(escape).join('|')})`, 'gi');
  return text.split(re).filter((t) => t !== '').map((t) => ({ text: t, flagged: live.some((p) => p.toLowerCase() === t.toLowerCase()) }));
}

/**
 * D5 DraftEditor: a real textarea with flagged phrases highlighted behind the text (P27 Highlight), a character count
 * against the channel limit, and a toolbar slot. The highlight layer mirrors the text exactly and is hidden from
 * assistive tech; the flags themselves are listed by AmbChecksList. States: editing, generating, over limit.
 */
export function AmbDraftEditor({ label, value, onChange, highlights = [], charLimit, generating = false, toolbar }: AmbDraftEditorProps) {
  const id = useId();
  const countId = `${id}-count`;
  const over = charLimit !== undefined && value.length > charLimit;
  return (
    <div className={styles.root}>
      <div className={styles.toolbar} role="toolbar" aria-label="Editor">
        {toolbar}
        <span id={countId} className={`${styles.count} ${over ? styles.over : ''}`}>
          {value.length}{charLimit !== undefined && ` / ${charLimit}`} characters{over && ' (over the limit)'}
        </span>
      </div>
      <label htmlFor={id} className="wl-visually-hidden">{label}</label>
      {generating ? (
        <div className={styles.skeleton} role="status" aria-label="Generating your draft">
          {[0, 1, 2, 3, 4].map((i) => <span key={i} className={styles.line} />)}
        </div>
      ) : (
        <div className={styles.frame}>
          <div className={styles.mirror} aria-hidden="true">
            {highlightRuns(value, highlights).map((r, i) => (r.flagged ? <mark key={i} className={styles.mark}>{r.text}</mark> : <span key={i}>{r.text}</span>))}
            {'​'}
          </div>
          <textarea id={id} className={styles.input} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={countId} aria-invalid={over || undefined} spellCheck />
        </div>
      )}
    </div>
  );
}
