import type { ReactNode } from 'react';
import { Badge, type BadgeTone } from '../primitives/Badge';
import styles from './SoonStatusRow.module.css';

export interface SoonStatusRowProps {
  name: ReactNode;
  detail?: ReactNode;
  status?: { label: string; tone?: BadgeTone };
  /** Row actions (Buttons or Links). */
  actions?: ReactNode;
  /** Highlights the row, e.g. the current brand. */
  selected?: boolean;
}

/** A list row: name and detail, a status chip and actions (model sources, connections, brands, sources). Render inside SoonStatusList. */
export function SoonStatusRow({ name, detail, status, actions, selected = false }: SoonStatusRowProps) {
  return (
    <li className={[styles.row, selected && styles.selected].filter(Boolean).join(' ')}>
      <div className={styles.text}>
        <span className={styles.name}>{name}</span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </div>
      <div className={styles.side}>
        {status && <Badge tone={status.tone}>{status.label}</Badge>}
        {actions}
      </div>
    </li>
  );
}
