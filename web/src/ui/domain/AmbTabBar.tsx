import { Link as RouterLink } from 'react-router';
import type { AmbNavItem } from './AmbShell';
import styles from './AmbShell.module.css';

/** L4 MobileTabBar: the ambassador's three tabs at the bottom of the mobile frame; the current one has aria-current="page". */
export function AmbTabBar({ items, active }: { items: AmbNavItem[]; active?: string }) {
  return (
    <nav aria-label="Ambassador" className={styles.tabbar}>
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
