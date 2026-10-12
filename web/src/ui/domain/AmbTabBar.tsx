import { Link as RouterLink } from 'react-router';
import type { AmbNavItem } from './AmbShell';
import styles from './AmbShell.module.css';

export interface AmbTabBarProps {
  items: AmbNavItem[];
  /** id of the current tab (aria-current="page"). */
  active?: string;
  /** Accessible name of the nav landmark. */
  label?: string;
}

/** L4 MobileTabBar: the ambassador's three tabs at the bottom of the mobile frame; the current one has aria-current="page". */
export function AmbTabBar({ items, active, label = 'Ambassador' }: AmbTabBarProps) {
  return (
    <nav aria-label={label} className={styles.tabbar}>
      <ul className={styles.tabs}>
        {items.map((item) => (
          <li key={item.id}>
            <RouterLink to={item.href} className={styles.tab} aria-current={item.id === active ? 'page' : undefined}>{item.label}</RouterLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
