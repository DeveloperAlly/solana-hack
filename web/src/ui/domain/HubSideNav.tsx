import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import styles from './HubSideNav.module.css';

export interface HubSideNavItem {
  id: string;
  label: string;
  count?: number;
  /** A screen or anchor to go to. Without it the item is a filter button that calls onSelect. */
  href?: string;
  /** Trailing marker, e.g. a D51 coverage badge in the kit table of contents. */
  badge?: ReactNode;
}

export interface HubSideNavSection {
  title?: string;
  items: HubSideNavItem[];
}

export interface HubSideNavProps {
  /** Accessible name of the nav landmark. */
  label: string;
  sections: HubSideNavSection[];
  /** id of the current item (aria-current for links, aria-pressed for filter buttons). */
  current?: string;
  onSelect?: (id: string) => void;
}

function ItemBody({ item }: { item: HubSideNavItem }) {
  return (
    <>
      <span className={styles.label}>{item.label}</span>
      {item.count !== undefined && <span className={styles.count}>{item.count}</span>}
      {item.badge}
    </>
  );
}

/**
 * L7 side rail (canvas Inbox-All, Inbox-NeedsReply; L8 table of contents on Brand-Build): titled groups of links or
 * filter buttons with counts or badges. Links go through the router; buttons filter in place.
 */
export function HubSideNav({ label, sections, current, onSelect }: HubSideNavProps) {
  return (
    <nav aria-label={label} className={styles.rail}>
      {sections.map((section, i) => (
        <div key={section.title ?? i} className={styles.section}>
          {section.title && <h3 className={styles.title}>{section.title}</h3>}
          <ul className={styles.list}>
            {section.items.map((item) => {
              const active = item.id === current;
              const cls = [styles.item, active && styles.active].filter(Boolean).join(' ');
              return (
                <li key={item.id}>
                  {item.href ? (
                    <RouterLink to={item.href} className={cls} aria-current={active ? 'page' : undefined}><ItemBody item={item} /></RouterLink>
                  ) : (
                    <button type="button" className={cls} aria-pressed={active} onClick={() => onSelect?.(item.id)}><ItemBody item={item} /></button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
