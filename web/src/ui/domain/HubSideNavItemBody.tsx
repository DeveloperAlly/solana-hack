import type { ReactNode } from 'react';
import styles from './HubSideNav.module.css';

export interface HubSideNavItemBodyProps {
  label: string;
  count?: number;
  badge?: ReactNode;
}

/** The inside of one HubSideNav item: label, then an optional count and badge. Used by HubSideNav only. */
export function HubSideNavItemBody({ label, count, badge }: HubSideNavItemBodyProps) {
  return (
    <>
      <span className={styles.label}>{label}</span>
      {count !== undefined && <span className={styles.count}>{count}</span>}
      {badge}
    </>
  );
}
