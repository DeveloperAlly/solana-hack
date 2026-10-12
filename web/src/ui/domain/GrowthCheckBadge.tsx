import { Icon } from '../primitives/Icon';
import styles from './GrowthCheckBadge.module.css';

export const growthBadgeStyles = [
  { id: 'outline', label: 'Outline' },
  { id: 'solid', label: 'Solid' },
  { id: 'compact', label: 'Compact' },
] as const;
export type GrowthBadgeStyle = (typeof growthBadgeStyles)[number]['id'];

export interface GrowthCheckBadgeProps {
  /** Brand whose post this is, e.g. "aDNA". */
  brand: string;
  /** `outline` (default), `solid` (inverse) or `compact` (one short line). */
  variant?: GrowthBadgeStyle;
}

/**
 * GrowthCheckBadge: the check-it badge a verified post carries back to JamJam (pitch deck v2, Business model slide,
 * Flywheel; issue #82). The words carry the meaning, never colour: "Official aDNA post · Checked on JamJam". Embedders
 * wrap it in their own link to Verify; it is a static image of the badge, with its text as the accessible name.
 */
export function GrowthCheckBadge({ brand, variant = 'outline' }: GrowthCheckBadgeProps) {
  const name = `Official ${brand} post, checked on JamJam`;
  return (
    <span className={`${styles.badge} ${styles[variant]}`} role="img" aria-label={name}>
      <Icon name="check" size={variant === 'compact' ? 'sm' : 'md'} />
      {variant === 'compact' ? (
        <span className={styles.line}>Checked on JamJam</span>
      ) : (
        <span className={styles.text}>
          <span className={styles.line}>Official {brand} post</span>
          <span className={styles.sub}>Checked on JamJam</span>
        </span>
      )}
    </span>
  );
}
