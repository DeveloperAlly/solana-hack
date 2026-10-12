import type { ReactNode } from 'react';
import { NavLink, Link as RouterLink } from 'react-router';
import styles from './MobileTabBar.module.css';

export interface MobileTabItem {
  id: string;
  label: ReactNode;
  href: string;
}

export interface MobileTabBarProps {
  /** Accessible name of the nav landmark, e.g. "Main" or "Ambassador". */
  label: string;
  /** At most five tabs (ADR-012 decision 2). */
  items: readonly MobileTabItem[];
  /** id of the current tab. When omitted, the router marks the tab whose href matches the URL. */
  current?: string;
}

/**
 * L4 MobileTabBar: the bottom tab bar on phone-width screens. AppFrame renders it for `placement: 'tabs'` (the
 * ambassador flow), and AppShell feeds it the loop's mobile tabs from config/nav.ts (Today, Create, Verify, Grow,
 * More; canvas M-Today).
 */
export function MobileTabBar({ label, items, current }: MobileTabBarProps) {
  return (
    <nav aria-label={label} className={styles.bar}>
      <ul className={styles.tabs}>
        {items.map((item) => (
          <li key={item.id}>
            {current === undefined ? (
              <NavLink to={item.href} className={styles.tab}>{item.label}</NavLink>
            ) : (
              <RouterLink to={item.href} className={styles.tab} aria-current={item.id === current ? 'page' : undefined}>{item.label}</RouterLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
