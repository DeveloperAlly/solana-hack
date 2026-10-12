import { useId, type ReactNode } from 'react';
import { BarTrack, placeSegments, type BarSize, type BarTone } from './BarTrack';
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
  /** Words before the overflow amount when the shares pass 100 (default "Over by"); BudgetBar says "Over budget by". */
  overflowLabel?: string;
  /** Threshold marker, 0–100, e.g. a warning line. */
  marker?: number;
  /** Visible caption under the bar, e.g. "135 spent · 60 committed · 305 left of 500 USDC". */
  caption?: ReactNode;
  size?: BarSize;
  /** Shows the label above the bar (it stays the accessible name), e.g. "Kit coverage". */
  showLabel?: boolean;
  /** In a wrapping row (a footer bar), takes the free space beside the actions. */
  grow?: boolean;
  /** Hides the bar from assistive tech when the numbers are already in nearby text (the caption still shows). */
  decorative?: boolean;
}

const pct = (n: number) => Math.round(Math.min(100, Math.max(0, n)));

/**
 * P24 ProgressBar: one segment is a labelled `progressbar`; several (spent / committed, with the track as remaining)
 * are one labelled image whose name lists each share. Optional threshold marker and caption.
 * Replaces BuilderProgressBar, JourneyProgress and AmbBar (issue #46, shared consolidation).
 */
export function ProgressBar({ label, segments, remainderLabel = 'Remaining', overflowLabel = 'Over by', marker, caption, size = 'md', showLabel = false, grow = false, decorative = false }: ProgressBarProps) {
  const labelId = useId();
  // The summary reads the same placed shares the bar draws (one function), and says so when the shares overflow.
  const { placed, overflow } = placeSegments(segments.map((s) => ({ pct: s.value, tone: s.tone })));
  const used = placed.reduce((sum, p) => sum + p.w, 0);
  const parts = [...segments.map((s, i) => `${s.label} ${pct(placed[i].w)}%`), `${remainderLabel} ${pct(100 - used)}%`];
  if (overflow > 0) parts.push(`${overflowLabel} ${Math.round(overflow)}%`);
  const summary = `${label}: ${parts.join(', ')}`;
  const single = segments.length === 1;
  const now = pct(placed[0]?.w ?? 0);
  const a11y = decorative
    ? { 'aria-hidden': true as const }
    : single
      ? { role: 'progressbar', ...(showLabel ? { 'aria-labelledby': labelId } : { 'aria-label': label }), 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': now, ...(overflow > 0 ? { 'aria-valuetext': `${now}%, ${overflowLabel.toLowerCase()} ${Math.round(overflow)}%` } : {}) }
      : { role: 'img', 'aria-label': summary };
  return (
    <div className={[styles.root, grow && styles.grow].filter(Boolean).join(' ')}>
      {showLabel && <span id={labelId} className={styles.label}>{label}</span>}
      <div {...a11y}>
        <BarTrack segments={segments.map((s) => ({ pct: s.value, tone: s.tone }))} marker={marker} size={size} />
      </div>
      {caption != null && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}
