import { useId, type ChangeEvent } from 'react';
import type { ButtonVariant } from '../primitives/Button';
import buttonStyles from '../primitives/Button.module.css';
import styles from './FilePicker.module.css';

export interface FilePickerProps {
  /** Visible button text, e.g. "Browse files" or "Upload a file". */
  label: string;
  /** Accepted types, as the input's accept attribute, e.g. ".pdf,.docx". */
  accept?: string;
  multiple?: boolean;
  /** Called with the chosen files. Files stay in the browser; the caller decides what to do with them. */
  onFiles: (files: File[]) => void;
  /** Line beside the button, e.g. "PDF or DOCX"; it also describes the input. */
  hint?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
}

/**
 * C14 FilePicker (button form): a native file input behind a label that wears P8 Button's own classes, so keyboard
 * and screen reader users get the real picker and it always matches a Button. The input resets after each pick, so
 * the same file can be chosen again. Replaces BuilderFilePicker and JourneyFileButton (issue #46, shared consolidation).
 */
export function FilePicker({ label, accept, multiple = false, onFiles, hint, variant = 'secondary', disabled = false }: FilePickerProps) {
  const id = useId();
  function change(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = '';
  }
  return (
    <span className={styles.root}>
      <input id={id} type="file" accept={accept} multiple={multiple} disabled={disabled} onChange={change} className={styles.input} aria-describedby={hint ? `${id}-hint` : undefined} />
      <label htmlFor={id} className={[buttonStyles.button, buttonStyles[variant], styles.button, disabled && styles.disabled].filter(Boolean).join(' ')}>{label}</label>
      {hint && <span id={`${id}-hint`} className={styles.hint}>{hint}</span>}
    </span>
  );
}
