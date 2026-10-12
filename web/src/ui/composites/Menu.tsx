import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import styles from './Menu.module.css';

export interface MenuItem {
  id: string;
  label: ReactNode;
  /** Checkable item (menuitemradio): true for the selected one. Leave undefined for a plain action. */
  checked?: boolean;
  disabled?: boolean;
}

export interface MenuProps {
  /** Trigger content; give it a clear accessible name (e.g. "aDNA, switch brand"). */
  trigger: ReactNode;
  /** Accessible name for the trigger when its content is not enough. */
  triggerLabel?: string;
  items: MenuItem[];
  onSelect: (id: string) => void;
  /** Start open (workbench and gallery). */
  defaultOpen?: boolean;
  align?: 'start' | 'end';
}

/**
 * C16 Menu: a menu button with plain or checkable items.
 * Keyboard per the WAI-ARIA menu button pattern (https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/):
 * Enter/Space/Down open on the first item, Up opens on the last; Up/Down/Home/End move; Escape closes and returns focus.
 */
export function Menu({ trigger, triggerLabel, items, onSelect, defaultOpen = false, align = 'start' }: MenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const base = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);

  useEffect(() => {
    if (open && focusIndex !== null) itemRefs.current[focusIndex]?.focus();
  }, [open, focusIndex]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function openAt(index: number | null) {
    setOpen(true);
    setFocusIndex(index);
  }
  function close(returnFocus = true) {
    setOpen(false);
    setFocusIndex(null);
    if (returnFocus) triggerRef.current?.focus();
  }
  function choose(i: number) {
    if (items[i].disabled) return;
    onSelect(items[i].id);
    close();
  }
  function onTriggerKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openAt(enabled[0] ?? null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openAt(enabled[enabled.length - 1] ?? null);
    }
  }
  function onItemKey(e: KeyboardEvent, i: number) {
    const pos = enabled.indexOf(i);
    const move = (p: number) => setFocusIndex(enabled[(p + enabled.length) % enabled.length]);
    if (e.key === 'ArrowDown') move(pos + 1);
    else if (e.key === 'ArrowUp') move(pos - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(enabled.length - 1);
    else if (e.key === 'Escape') close();
    else if (e.key === 'Tab') return close(false);
    else if (e.key === 'Enter' || e.key === ' ') choose(i);
    else return;
    e.preventDefault();
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        id={`${base}-trigger`}
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${base}-menu` : undefined}
        aria-label={triggerLabel}
        onClick={() => (open ? close(false) : openAt(null))}
        onKeyDown={onTriggerKey}
      >
        {trigger}
        <svg aria-hidden="true" className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M7 10l5 5 5-5" /></svg>
      </button>
      {open && (
        <ul role="menu" id={`${base}-menu`} aria-labelledby={`${base}-trigger`} className={`${styles.menu} ${styles[align]}`}>
          {items.map((it, i) => (
            <li
              key={it.id}
              ref={(el) => { itemRefs.current[i] = el; }}
              role={it.checked === undefined ? 'menuitem' : 'menuitemradio'}
              aria-checked={it.checked === undefined ? undefined : it.checked}
              aria-disabled={it.disabled || undefined}
              tabIndex={-1}
              className={styles.item}
              onClick={() => choose(i)}
              onKeyDown={(e) => onItemKey(e, i)}
            >
              {it.checked !== undefined && <span className={styles.mark} aria-hidden="true">{it.checked ? '✓' : ''}</span>}
              {it.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
