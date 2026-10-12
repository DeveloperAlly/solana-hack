import { useEffect, useState } from 'react';
import { Button, type ButtonVariant } from '../primitives/Button';
import styles from './JourneyCopyButton.module.css';

export type JourneyCopyStatus = 'idle' | 'copied' | 'failed';

export interface JourneyCopyButtonProps {
  /** The exact text put on the clipboard. */
  text: string;
  label: string;
  variant?: ButtonVariant;
  /** How long the "copied" confirmation stays, in milliseconds. */
  resetAfter?: number;
}

const statusText: Record<JourneyCopyStatus, string> = { idle: '', copied: 'Copied', failed: "Couldn't copy. Select the text and copy it instead." };

/**
 * JourneyCopyButton (inventory C13 CopyField, button form): copies text to the clipboard and confirms it in a live
 * region; if the browser refuses, it says so on screen. Used for Copy text (J6) and Copy post / Copy check link (J7) on
 * the canvas Journey boards (issue #48).
 */
export function JourneyCopyButton({ text, label, variant = 'secondary', resetAfter = 2000 }: JourneyCopyButtonProps) {
  const [status, setStatus] = useState<JourneyCopyStatus>('idle');
  useEffect(() => {
    if (status !== 'copied') return;
    const t = setTimeout(() => setStatus('idle'), resetAfter);
    return () => clearTimeout(t);
  }, [status, resetAfter]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
  }
  return (
    <span className={styles.root}>
      <Button variant={variant} onClick={copy}>{status === 'copied' ? `${label}: copied` : label}</Button>
      <span role="status" className={status === 'failed' ? styles.failed : 'wl-visually-hidden'}>{statusText[status]}</span>
    </span>
  );
}
