import styles from './Tabs.module.css';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

/** A tab's text with its optional count, shared by C4 Tabs and TabNav. */
export function TabLabel({ item }: { item: TabItem }) {
  return (
    <>
      {item.label}
      {item.count !== undefined && <>{' '}<span className={styles.count}>({item.count})</span></>}
    </>
  );
}

/** Class list for a tab, active or not. */
export const tabClass = (active: boolean) => [styles.tab, active && styles.active].filter(Boolean).join(' ');
