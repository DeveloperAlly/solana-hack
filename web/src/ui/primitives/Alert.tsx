import type { ReactNode } from 'react';
import styles from './Alert.module.css';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

/** C29 StatePanel (alert form): a toned message. Danger and warning are announced (role="alert"). */
export function Alert({ tone = 'info', title, children }: { tone?: AlertTone; title?: string; children?: ReactNode }) {
  return (
    <div className={`${styles.alert} ${styles[tone]}`} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}>
      {title && <span className={styles.title}>{title}</span>}
      {children && <span>{children}</span>}
    </div>
  );
}
