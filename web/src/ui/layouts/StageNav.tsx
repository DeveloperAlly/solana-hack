import { Link as RouterLink } from 'react-router';
import { loopStages, utilityStages, type Stage, type StageId } from '../../config/nav';
import { useNavHref } from '../hooks/useNavHref';
import styles from './StageNav.module.css';

export interface StageNavProps {
  /** The stage the screen belongs to; its link gets aria-current="page". */
  current?: StageId;
  /** Accessible name of the nav landmark (default "Main", as the canvas names it). */
  label?: string;
}

function StageGroup({ name, items, current }: { name: string; items: readonly Stage[]; current?: StageId }) {
  const href = useNavHref();
  return (
    <ul className={styles.group} aria-label={name}>
      {items.map((s) => (
        <li key={s.id}>
          <RouterLink to={href(s)} className={styles.link} aria-current={s.id === current ? 'page' : undefined}>{s.label}</RouterLink>
        </li>
      ))}
    </ul>
  );
}

/**
 * L2 StageNav: the one main nav (ADR-012 decision 2), read from config/nav.ts. Today and the six loop steps, a
 * divider, then the utilities Inbox and Settings. The divider is the second group's border, so screen readers hear
 * two named lists rather than a stray character.
 */
export function StageNav({ current, label = 'Main' }: StageNavProps) {
  return (
    <nav aria-label={label} className={styles.nav}>
      <StageGroup name="The loop" items={loopStages} current={current} />
      <StageGroup name="Utilities" items={utilityStages} current={current} />
    </nav>
  );
}
