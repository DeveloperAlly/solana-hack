import { useState } from 'react';
import { Button, type ButtonVariant } from '../primitives/Button';

export interface SoonCopyButtonProps {
  /** The text put on the clipboard. */
  text: string;
  label: string;
  variant?: ButtonVariant;
}

type CopyState = 'idle' | 'copied' | 'failed';
const announce: Record<CopyState, string> = { idle: '', copied: 'Copied to the clipboard.', failed: 'Could not copy. Select the text and copy it yourself.' };

/** Copy-to-clipboard button: copies `text`, then announces the result politely (copied, or failed with a fallback). */
export function SoonCopyButton({ text, label, variant = 'secondary' }: SoonCopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
  }
  return (
    <>
      <Button variant={variant} onClick={copy}>{{ idle: label, copied: 'Copied', failed: 'Copy failed' }[state]}</Button>
      <span role="status" className="wl-visually-hidden">{announce[state]}</span>
    </>
  );
}
