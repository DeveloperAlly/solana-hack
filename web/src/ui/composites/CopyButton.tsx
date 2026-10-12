import { useState } from 'react';
import { Button, type ButtonVariant } from '../primitives/Button';
import styles from './CopyButton.module.css';

export type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Where the result shows. `status`: a visible line beside the button (default; the button keeps its label).
 * `label`: the button text itself changes to the result, and a visually hidden status line announces the longer message.
 */
export type CopyFeedback = 'status' | 'label';

export interface CopyButtonProps {
  /** Text put on the clipboard. */
  value: string;
  /** Button label before copying, e.g. "Copy value". */
  label: string;
  variant?: ButtonVariant;
  feedback?: CopyFeedback;
  /** Override the result messages (announced politely). Defaults: "Copied" / "Copy failed: select and copy it by hand". */
  messages?: Partial<Record<Exclude<CopyState, 'idle'>, string>>;
  /** Short button labels for `feedback="label"`. Defaults: "Copied" / "Copy failed". */
  resultLabels?: Partial<Record<Exclude<CopyState, 'idle'>, string>>;
  /** Called after each attempt, e.g. to log or show a toast. */
  onCopy?: (result: Exclude<CopyState, 'idle'>) => void;
}

const defaultMessages = { copied: 'Copied', failed: 'Copy failed: select and copy it by hand' } as const;
const defaultResultLabels = { copied: 'Copied', failed: 'Copy failed' } as const;

/**
 * C13 CopyField action: copies `value` with the Clipboard API and says so in a polite live region; on failure it tells
 * the person to copy by hand. Replaces BuilderCopyButton and SoonCopyButton (issue #46, shared consolidation).
 */
export function CopyButton({ value, label, variant = 'secondary', feedback = 'status', messages, resultLabels, onCopy }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle');
  async function copy() {
    let result: Exclude<CopyState, 'idle'>;
    try {
      await navigator.clipboard.writeText(value);
      result = 'copied';
    } catch {
      result = 'failed';
    }
    setState(result);
    onCopy?.(result);
  }
  const message = state === 'idle' ? '' : (messages?.[state] ?? defaultMessages[state]);
  const buttonText = feedback === 'label' && state !== 'idle' ? (resultLabels?.[state] ?? defaultResultLabels[state]) : label;
  return (
    <span className={styles.root}>
      <Button variant={variant} onClick={copy}>{buttonText}</Button>
      <span role="status" className={feedback === 'label' ? 'wl-visually-hidden' : styles.status}>{message}</span>
    </span>
  );
}
