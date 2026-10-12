import type { ReactNode } from 'react';
import { BarTrack, type BarSize } from './BarTrack';
import styles from './Meter.module.css';

export interface MeterProps {
  /** Accessible name, e.g. "On-brand score". */
  label: string;
  value: number;
  min?: number;
  max?: number;
  /** Threshold drawn as a marker, in the same units as value (e.g. the publish line at 80). */
  threshold?: number;
  /** What a screen reader says for the value. Default: "<value> of <max>" or, with a threshold, "<value>, threshold <threshold>". */
  valueText?: string;
  /** Visible summary above the bar: the score, a chip, an action. */
  summary?: ReactNode;
  /** Visible hint under the bar, e.g. what the threshold means. */
  hint?: ReactNode;
  size?: BarSize;
}

/** Whether a value meets its threshold; a meter without a threshold always meets it. */
export function meetsThreshold(value: number, threshold?: number): boolean {
  return threshold === undefined || value >= threshold;
}

/**
 * P25 Meter: a scalar value in a known range as a labelled `meter`, with an optional threshold marker, summary and hint.
 * States: below / at or above threshold (`data-below` on the root, for presets such as D4 VoiceFitMeter).
 * Replaces the bar inside AmbOnBrandMeter (issue #46, shared consolidation).
 */
export function Meter({ label, value, min = 0, max = 100, threshold, valueText, summary, hint, size = 'md' }: MeterProps) {
  const span = max - min || 1;
  const toPct = (n: number) => ((n - min) / span) * 100;
  const text = valueText ?? (threshold === undefined ? `${value} of ${max}` : `${value}, threshold ${threshold}`);
  return (
    <div className={styles.root} data-below={meetsThreshold(value, threshold) ? undefined : true}>
      {summary && <div className={styles.summary}>{summary}</div>}
      <div role="meter" aria-label={label} aria-valuenow={value} aria-valuemin={min} aria-valuemax={max} aria-valuetext={text}>
        <BarTrack segments={[{ pct: toPct(value) }]} marker={threshold === undefined ? undefined : toPct(threshold)} size={size} />
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
