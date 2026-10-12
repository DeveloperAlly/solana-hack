import { useId, type ReactNode } from 'react';
import { useRovingFocus } from '../hooks/useRovingFocus';
import { TabLabel, tabClass, type TabItem } from './TabLabel';
import styles from './Tabs.module.css';

export type { TabItem } from './TabLabel';
export { TabNav, type TabNavProps } from './TabNav';

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
  const roving = useRovingFocus({ count: items.length, orientation: 'horizontal', onMove: (i) => onChange(items[i].id) });
  const active = items.find((i) => i.id === value) ?? items[0];

  return (
    <div className={styles.root}>
      <div role="tablist" aria-label={label} className={styles.list}>
        {items.map((item, i) => {
          const selected = item.id === active?.id;
          return (
            <button
              key={item.id}
              ref={roving.itemRef(i)}
              type="button"
              role="tab"
              id={`${base}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              className={tabClass(selected)}
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => roving.onItemKeyDown(e, i)}
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
