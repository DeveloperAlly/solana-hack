import styles from './AmbBar.module.css';

export type AmbBarTone = 'primary' | 'secondary';

export interface AmbBarSegment {
  /** Share of the bar, 0–100. */
  pct: number;
  tone: AmbBarTone;
}

export interface AmbBarProps {
  segments: AmbBarSegment[];
  /** Threshold marker position, 0–100 (the on-brand publish line). */
  marker?: number;
  size?: 'sm' | 'md';
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * P24 ProgressBar (decorative): stacked segments on a track, with an optional threshold marker. Drawn as SVG so the
 * widths are attributes, not inline styles; fills come from tokens. Always aria-hidden: the caller shows the numbers
 * as text or wraps it in a labelled meter (AmbOnBrandMeter, AmbBudgetBar).
 */
export function AmbBar({ segments, marker, size = 'md' }: AmbBarProps) {
  const placed = segments.reduce<{ x: number; w: number; tone: AmbBarTone }[]>((acc, s) => {
    const x = acc.reduce((sum, p) => sum + p.w, 0);
    return [...acc, { x, w: clamp(Math.min(s.pct, 100 - x)), tone: s.tone }];
  }, []);
  return (
    <svg aria-hidden="true" focusable="false" className={`${styles.bar} ${styles[size]}`} viewBox="0 0 100 10" preserveAspectRatio="none">
      <rect className={styles.track} x="0" y="0" width="100" height="10" />
      {placed.map((p, i) => (
        <rect key={i} className={styles[p.tone]} x={p.x} y="0" width={p.w} height="10" />
      ))}
      {marker !== undefined && <rect className={styles.marker} x={clamp(marker) - 0.5} y="0" width="1" height="10" />}
    </svg>
  );
}
