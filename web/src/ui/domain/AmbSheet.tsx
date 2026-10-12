import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from '../primitives/Button';
import styles from './AmbSheet.module.css';

export interface AmbSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
}

const focusable = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * C18 Sheet: a modal panel, a bottom sheet on narrow screens and a side panel on wide ones (mobile flags, receipt
 * details; canvas notes n-m3, n-m5). Focus moves into it and is kept there; Escape, Close or the scrim closes it and
 * focus returns to the control that opened it. Dialog pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */
export function AmbSheet({ open, onClose, title, children }: AmbSheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    panelRef.current?.focus();
    return () => {
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [open]);

  if (!open) return null;

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusable));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className={styles.layer}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onKeyDown={onKey}>
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
