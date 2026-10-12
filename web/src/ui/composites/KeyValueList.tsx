import type { ReactNode } from 'react';
import styles from './KeyValueList.module.css';

export interface KeyValueItem {
  label: string;
  value: ReactNode;
}

/** C11 KeyValueList: label / value rows as a description list (receipts, verify results, success screens). */
export function KeyValueList({ items, label }: { items: KeyValueItem[]; label?: string }) {
  return (
    <dl className={styles.list} aria-label={label}>
      {items.map((i) => (
        <div key={i.label} className={styles.row}>
          <dt className={styles.label}>{i.label}</dt>
          <dd className={styles.value}>{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
