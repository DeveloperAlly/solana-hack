import { useId, type ReactNode } from 'react';
import styles from './DraftEditor.module.css';

export interface DraftEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Phrases flagged by the checks; they are highlighted wherever they appear in the text. */
  highlights?: string[];
  /** Per-channel character limit; the count turns to an error over it. */
  charLimit?: number;
  /** How the count is measured, where the platform counts its own way (X weights characters); default: characters. */
  measure?: (text: string) => number;
  /** Shown after the count, e.g. "as X counts them". */
  countNote?: string;
  /** Read only (a registered post cannot change), with the reason in `hint`. */
  readOnly?: boolean;
  /** Help under the editor. */
  hint?: ReactNode;
  /** An error under the editor, e.g. how far over the limit it is; marks the text invalid. */
  error?: string | null;
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
 * D5 DraftEditor (Ambassador Generate, Superhub Draft-Review): a real textarea with flagged phrases highlighted behind the text (P27 Highlight), a character count
 * against the channel limit, and a toolbar slot. The highlight layer mirrors the text exactly and is hidden from
 * assistive tech; the flags themselves are listed by AmbChecksList. States: editing, generating, over limit.
 */
export function DraftEditor({ label, value, onChange, highlights = [], charLimit, measure, countNote, readOnly = false, hint, error, generating = false, toolbar }: DraftEditorProps) {
  const id = useId();
  const countId = `${id}-count`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const size = measure ? measure(value) : value.length;
  const over = charLimit !== undefined && size > charLimit;
  const describedBy = [countId, hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ');
  return (
    <div className={styles.root}>
      <div className={styles.toolbar} role="toolbar" aria-label="Editor">
        {toolbar}
        <span id={countId} className={`${styles.count} ${over ? styles.over : ''}`}>
          {size}{charLimit !== undefined && ` / ${charLimit}`} characters{countNote && ` (${countNote})`}{over && ' (over the limit)'}
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
          <textarea id={id} className={styles.input} value={value} readOnly={readOnly} onChange={(e) => onChange(e.target.value)} aria-describedby={describedBy} aria-invalid={over || Boolean(error) || undefined} spellCheck />
        </div>
      )}
      {hint && <p id={hintId} className={styles.hint}>{hint}</p>}
      {error && <p id={errorId} className={styles.error}>{error}</p>}
    </div>
  );
}
