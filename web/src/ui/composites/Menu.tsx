import { useCallback, useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useDisclosure } from '../hooks/useDisclosure';
import { useRovingFocus } from '../hooks/useRovingFocus';
import { Icon } from '../primitives/Icon';
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
  /** Start open (workbench and gallery). Focus stays where it is until the user opens the menu. */
  defaultOpen?: boolean;
  align?: 'start' | 'end';
}

/**
 * C16 Menu: a menu button with plain or checkable items, per the WAI-ARIA menu button pattern
 * (https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/):
 * - opening by click, Enter, Space or Down focuses the first enabled item; Up focuses the last;
 * - Up/Down/Home/End move between items; Enter or Space chooses;
 * - Escape and Tab close the menu and return focus to the trigger; a press outside closes it.
 */
export function Menu({ trigger, triggerLabel, items, onSelect, defaultOpen = false, align = 'start' }: MenuProps) {
  const base = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { open, show, hide } = useDisclosure({ defaultOpen, containerRef: rootRef });
  const isDisabled = useCallback((i: number) => !!items[i]?.disabled, [items]);
  const roving = useRovingFocus({ count: items.length, orientation: 'vertical', isDisabled });
  // Which item to focus once the menu has rendered after a user opened it.
  const pendingFocus = useRef<'first' | 'last' | null>(null);

  useEffect(() => {
    if (!open || !pendingFocus.current) return;
    roving.focusAt(pendingFocus.current === 'first' ? roving.first() : roving.last());
    pendingFocus.current = null;
  }, [open, roving]);

  function openAt(where: 'first' | 'last') {
    pendingFocus.current = where;
    show();
  }
  function close() {
    hide();
    triggerRef.current?.focus();
  }
  function choose(i: number) {
    if (items[i].disabled) return;
    onSelect(items[i].id);
    close();
  }
  function onTriggerKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openAt('first');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      openAt('last');
    }
  }
  function onItemKey(e: KeyboardEvent, i: number) {
    if (roving.onItemKeyDown(e, i)) return;
    if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      close();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(i);
    }
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
        onClick={() => (open ? hide() : openAt('first'))}
        onKeyDown={onTriggerKey}
      >
        {trigger}
        <Icon name="chevron-down" size="sm" />
      </button>
      {open && (
        <ul role="menu" id={`${base}-menu`} aria-labelledby={`${base}-trigger`} className={`${styles.menu} ${styles[align]}`}>
          {items.map((it, i) => (
            <li
              key={it.id}
              ref={roving.itemRef(i)}
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
