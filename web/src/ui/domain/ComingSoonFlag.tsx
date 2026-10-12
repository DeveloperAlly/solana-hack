import type { RouteTag } from '../../config/routes';
import styles from './ComingSoonFlag.module.css';

const labels: Partial<Record<RouteTag, string>> = { 'COMING SOON': 'Coming soon', ROADMAP: 'Roadmap', EXPERIMENTAL: 'Experimental' };

export interface ComingSoonFlagProps {
  /** Route tag from M1 (config/routes.ts); HACKATHON tags render nothing. */
  tag?: RouteTag;
  /** Override the label. */
  children?: string;
}

/** ComingSoonFlag: the solid "Coming soon" / "Roadmap" chip on screens and sections that are drawn but not built. */
export function ComingSoonFlag({ tag = 'COMING SOON', children }: ComingSoonFlagProps) {
  const label = children ?? labels[tag];
  if (!label) return null;
  return <span className={styles.flag}>{label}</span>;
}
