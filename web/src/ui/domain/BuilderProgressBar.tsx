import styles from './BuilderProgressBar.module.css';

export type ProgressTone = 'strong' | 'muted';

export interface ProgressSegment {
  /** Share of the whole, 0–100. */
  value: number;
  label: string;
  tone?: ProgressTone;
}

export interface BuilderProgressBarProps {
  /** Accessible name, e.g. "Reading progress" or "Budget". */
  label: string;
  /** Segments in order from the start of the bar; the rest of the track is what remains. */
  segments: ProgressSegment[];
  /** Visible caption under the bar, e.g. "135 spent · 60 committed · 305 left of 500 USDC". */
  caption?: string;
}

/**
 * P24 ProgressBar. One segment is a native progressbar. Several (spent / committed, with the track as remaining) are
 * stacked native <progress> layers, each filled to its running total, so widths need no inline style; the group is
 * one labelled image and the caption carries the numbers. Canvas boards Onboard-3b-Profiling and Dashboard (D25).
 */
export function BuilderProgressBar({ label, segments, caption }: BuilderProgressBarProps) {
  const totals = segments.map((_, i) => segments.slice(0, i + 1).reduce((sum, s) => sum + s.value, 0));
  const single = segments.length === 1;
  const name = single ? label : `${label}: ${segments.map((s) => `${s.label} ${Math.round(s.value)}%`).join(', ')}`;
  return (
    <div className={styles.root}>
      <div className={styles.track} role={single ? undefined : 'img'} aria-label={single ? undefined : name}>
        {segments
          .map((s, i) => (
            <progress
              key={s.label}
              className={`${styles.layer} ${styles[s.tone ?? 'strong']}`}
              max={100}
              value={Math.min(100, totals[i])}
              aria-label={single ? name : undefined}
              aria-hidden={single ? undefined : true}
            />
          ))
          .reverse()}
      </div>
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}
