import type { ChangeEvent } from 'react';
import styles from './JourneyFileButton.module.css';

export interface JourneyFileButtonProps {
  label: string;
  /** File types, as the input's accept attribute, e.g. ".pdf,.docx". */
  accept?: string;
  /** Called with the chosen file. The file stays in the browser; the caller decides what to do with it. */
  onFile: (file: File) => void;
}

/**
 * JourneyFileButton: a native file input that looks like a secondary button (canvas boards J1-Read "Upload a file" and
 * "PDF or DOCX"; issue #48). The input stays in the tab order, so keyboard and screen reader users get the native picker.
 */
export function JourneyFileButton({ label, accept, onFile }: JourneyFileButtonProps) {
  function change(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  }
  return (
    <label className={styles.button}>
      <input type="file" accept={accept} className={styles.input} onChange={change} />
      {label}
    </label>
  );
}
