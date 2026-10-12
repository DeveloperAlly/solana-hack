import { routeTagLabels, type RouteTag } from '../../config/routes';
import styles from './ComingSoonFlag.module.css';

export interface ComingSoonFlagProps {
  /** Route tag from M1 (config/routes.ts); tags whose label record has flag: false (HACKATHON) render nothing. */
  tag?: RouteTag;
  /** Override the label. */
  children?: string;
}

/** ComingSoonFlag: the solid chip ("Coming soon", "Roadmap", "Stretch" …) on screens and sections not built for the hackathon. */
export function ComingSoonFlag({ tag = 'COMING SOON', children }: ComingSoonFlagProps) {
  const entry = routeTagLabels[tag];
  if (!entry.flag && !children) return null;
  return <span className={styles.flag}>{children ?? entry.label}</span>;
}
