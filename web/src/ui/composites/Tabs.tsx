import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

function TabLabel({ item }: { item: TabItem }) {
  return (
    <>
      {item.label}
      {item.count !== undefined && <span className={styles.count}>({item.count})</span>}
    </>
  );
}

export interface TabsProps {
  /** Accessible name of the tab list. */
  label: string;
  items: (TabItem & { panel: ReactNode })[];
  value: string;
  onChange: (id: string) => void;
}

/**
 * C4 Tabs (state driven): WAI-ARIA tabs with automatic activation; Left/Right/Home/End move between tabs.
 * Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
 */
export function Tabs({ label, items, value, onChange }: TabsProps) {
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = items.find((i) => i.id === value) ?? items[0];

  function onKey(e: KeyboardEvent, index: number) {
    const last = items.length - 1;
    const next = e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next === null) return;
    e.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div className={styles.root}>
      <div role="tablist" aria-label={label} className={styles.list}>
        {items.map((item, i) => {
          const selected = item.id === active?.id;
          return (
            <button
              key={item.id}
              ref={(el) => { refs.current[i] = el; }}
              type="button"
              role="tab"
              id={`${base}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              className={[styles.tab, selected && styles.active].filter(Boolean).join(' ')}
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <TabLabel item={item} />
            </button>
          );
        })}
      </div>
      {active && (
        <div role="tabpanel" id={`${base}-panel-${active.id}`} aria-labelledby={`${base}-tab-${active.id}`} tabIndex={0} className={styles.panel}>
          {active.panel}
        </div>
      )}
    </div>
  );
}

export interface TabNavProps {
  label: string;
  items: (TabItem & { href: string })[];
  /** id of the current item; it gets aria-current="page". */
  value: string;
}

/** C4 Tabs (link driven): a tab-styled nav where each tab is a page; the current one has aria-current="page". */
export function TabNav({ label, items, value }: TabNavProps) {
  return (
    <nav aria-label={label}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <RouterLink
              to={item.href}
              aria-current={item.id === value ? 'page' : undefined}
              className={[styles.tab, item.id === value && styles.active].filter(Boolean).join(' ')}
            >
              <TabLabel item={item} />
            </RouterLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
