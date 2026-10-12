import type { ReactNode } from 'react';
import { BarTrack, type BarSize, type BarTone } from './BarTrack';
import styles from './ProgressBar.module.css';

export interface ProgressSegment {
  /** Share of the whole, 0–100. */
  value: number;
  /** Names the segment in the accessible summary, e.g. "Spent". */
  label: string;
  /** `primary` (default, dark) or `secondary` (mid grey), e.g. spent and committed. */
  tone?: BarTone;
}

export interface ProgressBarProps {
  /** Accessible name, e.g. "Reading progress" or "Budget". */
  label: string;
  /** Segments in order from the start of the bar; the rest of the track is what remains. One segment is a plain progress bar. */
  segments: ProgressSegment[];
  /** Name of what is left in the multi-segment summary (default "Remaining"). */
  remainderLabel?: string;
  /** Threshold marker, 0–100, e.g. a warning line. */
  marker?: number;
  /** Visible caption under the bar, e.g. "135 spent · 60 committed · 305 left of 500 USDC". */
  caption?: ReactNode;
  size?: BarSize;
  /** Hides the bar from assistive tech when the numbers are already in nearby text (the caption still shows). */
  decorative?: boolean;
}

const pct = (n: number) => Math.round(Math.min(100, Math.max(0, n)));

/**
 * P24 ProgressBar: one segment is a labelled `progressbar`; several (spent / committed, with the track as remaining)
 * are one labelled image whose name lists each share. Optional threshold marker and caption.
 * Replaces BuilderProgressBar and AmbBar (issue #46, shared consolidation).
 */
export function ProgressBar({ label, segments, remainderLabel = 'Remaining', marker, caption, size = 'md', decorative = false }: ProgressBarProps) {
  const single = segments.length === 1;
  const used = segments.reduce((sum, s) => sum + s.value, 0);
  const summary = `${label}: ${[...segments.map((s) => `${s.label} ${pct(s.value)}%`), `${remainderLabel} ${pct(100 - used)}%`].join(', ')}`;
  const a11y = decorative
    ? { 'aria-hidden': true as const }
    : single
      ? { role: 'progressbar', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct(segments[0].value) }
      : { role: 'img', 'aria-label': summary };
  return (
    <div className={styles.root}>
      <div {...a11y}>
        <BarTrack segments={segments.map((s) => ({ pct: s.value, tone: s.tone }))} marker={marker} size={size} />
      </div>
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}
