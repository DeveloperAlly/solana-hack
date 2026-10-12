import { Card } from './Card';
import { SampleFlag } from './SampleFlag';
import styles from './StatTile.module.css';

export interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
  /** Makes the tile a link to the detail screen. */
  href?: string;
  /** Marks the number as sample data (canvas "Sample data" chip). */
  sample?: boolean;
  loading?: boolean;
}

/** C12 StatTile: a KPI with label, value, sub line, optional link and sample-data flag; loading state. */
export function StatTile({ label, value, sub, href, sample, loading }: StatTileProps) {
  return (
    <Card href={loading ? undefined : href} as="div" variant={sample ? 'subtle' : 'default'}>
      <span className={styles.label}>{label}</span>
      {loading ? (
        <span className={styles.skeleton} role="status" aria-label={`${label}: loading`} />
      ) : (
        <strong className={styles.value}>{value}</strong>
      )}
      {(sub || sample) && (
        <span className={styles.sub}>
          {sub}
          {sample && <SampleFlag />}
        </span>
      )}
    </Card>
  );
}
