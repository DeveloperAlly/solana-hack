import { useState } from 'react';
import { Button, type ButtonVariant } from '../primitives/Button';
import styles from './BuilderCopyButton.module.css';

export interface BuilderCopyButtonProps {
  /** Text put on the clipboard. */
  value: string;
  /** Button label before copying, e.g. "Copy value". */
  label: string;
  variant?: ButtonVariant;
}

type CopyState = 'idle' | 'copied' | 'failed';
const messages: Record<CopyState, string> = { idle: '', copied: 'Copied', failed: 'Copy failed: select and copy by hand' };

/**
 * C13 CopyField action: copies a value with the Clipboard API and says so (politely announced).
 * Canvas boards Onboard-2-Domain (TXT value), Kit-RegisterFailed (error details), Dashboard-Empty (public page link).
 */
export function BuilderCopyButton({ value, label, variant = 'secondary' }: BuilderCopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('failed');
    }
  }
  return (
    <span className={styles.root}>
      <Button variant={variant} onClick={copy}>{label}</Button>
      <span role="status" className={styles.status}>{messages[state]}</span>
    </span>
  );
}
