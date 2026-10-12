import { useEffect, useState } from 'react';
import { Button, type ButtonVariant } from '../primitives/Button';
import styles from './CopyButton.module.css';

export type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Where the result shows. `status`: a visible line beside the button (default; the button keeps its label).
 * `label`: the button text itself changes to the result, and a visually hidden status line announces the longer message.
 * `both`: the button text changes, and the status line is also visible (Journey: "Copy text: copied", failure on screen).
 */
export type CopyFeedback = 'status' | 'label' | 'both';

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
  /** Milliseconds after which a "copied" result clears back to idle (a failure stays). Default: it stays. */
  resetAfter?: number;
  /** Called after each attempt, e.g. to log or show a toast. */
  onCopy?: (result: Exclude<CopyState, 'idle'>) => void;
}

const defaultMessages = { copied: 'Copied', failed: 'Copy failed: select and copy it by hand' } as const;
const defaultResultLabels = { copied: 'Copied', failed: 'Copy failed' } as const;

/**
 * C13 CopyField action: copies `value` with the Clipboard API and says so in a polite live region; on failure it tells
 * the person to copy by hand. Replaces BuilderCopyButton, SoonCopyButton and JourneyCopyButton (issue #46, shared consolidation).
 */
export function CopyButton({ value, label, variant = 'secondary', feedback = 'status', messages, resultLabels, resetAfter, onCopy }: CopyButtonProps) {
  // The result is kept with the value it was for, so feedback resets to idle as soon as `value` changes.
  const [last, setLast] = useState<{ value: string; status: Exclude<CopyState, 'idle'> } | null>(null);
  const state: CopyState = last && last.value === value ? last.status : 'idle';
  useEffect(() => {
    if (state !== 'copied' || resetAfter === undefined) return;
    const t = setTimeout(() => setLast(null), resetAfter);
    return () => clearTimeout(t);
  }, [state, resetAfter, last]);
  async function copy() {
    const copied = value;
    let result: Exclude<CopyState, 'idle'>;
    try {
      await navigator.clipboard.writeText(copied);
      result = 'copied';
    } catch {
      result = 'failed';
    }
    setLast({ value: copied, status: result });
    onCopy?.(result);
  }
  const message = state === 'idle' ? '' : (messages?.[state] ?? defaultMessages[state]);
  const buttonText = feedback !== 'status' && state !== 'idle' ? (resultLabels?.[state] ?? defaultResultLabels[state]) : label;
  return (
    <span className={styles.root}>
      <Button variant={variant} onClick={copy}>{buttonText}</Button>
      <span role="status" className={feedback === 'label' ? 'wl-visually-hidden' : styles.status}>{message}</span>
    </span>
  );
}
