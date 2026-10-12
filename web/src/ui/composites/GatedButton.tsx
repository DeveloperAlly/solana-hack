import { useId, type ReactNode } from 'react';
import { Button, type ButtonVariant } from '../primitives/Button';
import type { Gate } from '../../domain/approval';
import styles from './GatedButton.module.css';

export type { Gate };

export interface GatedButtonProps {
  gate: Gate;
  children: ReactNode;
  /** Runs the action; never called while the gate blocks. */
  onClick?: () => void;
  /** A link target instead of onClick; while the gate blocks it renders as a disabled button, never a live link. */
  href?: string;
  variant?: ButtonVariant;
  /** Shows the gate's label when it passes too (default: only the blocking reason). */
  showPassLabel?: boolean;
}

/**
 * C36 GatedButton: an action and the one check that gates it, side by side, from one `{ blocking, label }` result. While
 * the gate blocks, the button is disabled and the reason is read with it (aria-describedby), so a blocked reason never
 * sits beside an enabled button. States: open, blocked.
 */
export function GatedButton({ gate, children, onClick, href, variant = 'primary', showPassLabel = false }: GatedButtonProps) {
  const id = useId();
  const showLabel = gate.blocking || showPassLabel;
  const describedBy = showLabel ? id : undefined;
  return (
    <span className={styles.root}>
      {href && !gate.blocking ? (
        <Button href={href} variant={variant} onClick={onClick}>{children}</Button>
      ) : (
        <Button variant={variant} disabled={gate.blocking} aria-describedby={describedBy} onClick={gate.blocking ? undefined : onClick}>
          {children}
        </Button>
      )}
      {showLabel && <span id={id} className={gate.blocking ? styles.blocked : styles.pass}>{gate.label}</span>}
    </span>
  );
}
