import { useId, type ChangeEvent } from 'react';
import styles from './BuilderFilePicker.module.css';

export interface BuilderFilePickerProps {
  /** Visible button text, e.g. "Browse files". */
  label: string;
  /** Accepted types, e.g. ".pdf,.md,.docx". */
  accept?: string;
  multiple?: boolean;
  /** Called with the chosen files' names. Files stay in the browser. */
  onFiles: (names: string[]) => void;
  hint?: string;
}

/**
 * C14 file picker (button form): a native file input behind a button-styled label, so keyboard and screen readers use
 * the real control. Canvas boards Onboard-3-Sources ("Browse files") and Ingest-Error ("Upload it as a file").
 */
export function BuilderFilePicker({ label, accept, multiple = false, onFiles, hint }: BuilderFilePickerProps) {
  const id = useId();
  function change(e: ChangeEvent<HTMLInputElement>) {
    const names = Array.from(e.target.files ?? []).map((f) => f.name);
    if (names.length) onFiles(names);
    e.target.value = '';
  }
  return (
    <span className={styles.root}>
      <input id={id} type="file" accept={accept} multiple={multiple} onChange={change} className={styles.input} aria-describedby={hint ? `${id}-hint` : undefined} />
      <label htmlFor={id} className={styles.button}>{label}</label>
      {hint && <span id={`${id}-hint`} className={styles.hint}>{hint}</span>}
    </span>
  );
}
