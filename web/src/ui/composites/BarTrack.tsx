import styles from './BarTrack.module.css';

export type BarTone = 'primary' | 'secondary';
export type BarSize = 'sm' | 'md';

export interface BarTrackSegment {
  /** Share of the track, 0–100. Segments sit end to end from the start; the rest of the track is what remains. */
  pct: number;
  tone?: BarTone;
}

export interface BarTrackProps {
  segments: BarTrackSegment[];
  /** Threshold marker position, 0–100. */
  marker?: number;
  size?: BarSize;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

export interface PlacedSegment {
  x: number;
  /** Drawn width: the share left on the track after the segments before it, so the total never passes 100. */
  w: number;
  tone: BarTone;
}

/**
 * Places segments end to end on a 0–100 track. The one source of truth for both the drawing and any accessible
 * summary (Codex review on PR #80), so what is read always matches what is drawn. `overflow` is how far the
 * requested shares pass 100 (0 when they fit).
 */
export function placeSegments(segments: BarTrackSegment[]): { placed: PlacedSegment[]; overflow: number } {
  let x = 0;
  let requested = 0;
  const placed = segments.map((s) => {
    const pct = Math.max(0, s.pct);
    requested += pct;
    const w = clamp(Math.min(pct, 100 - x));
    const rect = { x, w, tone: s.tone ?? 'primary' };
    x += w;
    return rect;
  });
  return { placed, overflow: Math.max(0, requested - 100) };
}

/**
 * The drawn bar shared by P24 ProgressBar, P25 Meter and C22 BarList: a track, stacked segments and an optional
 * marker. SVG, so widths are attributes rather than inline styles; fills come from semantic tokens. Always hidden from
 * assistive tech: the component that uses it carries the role, name and value.
 */
export function BarTrack({ segments, marker, size = 'md' }: BarTrackProps) {
  const { placed } = placeSegments(segments);
  return (
    <svg aria-hidden="true" focusable="false" className={`${styles.bar} ${styles[size]}`} viewBox="0 0 100 10" preserveAspectRatio="none">
      <rect className={styles.track} x="0" y="0" width="100" height="10" />
      {placed.map((p, i) => (
        <rect key={i} className={styles[p.tone]} x={p.x} y="0" width={p.w} height="10" />
      ))}
      {marker !== undefined && <rect className={styles.marker} x={Math.min(99, Math.max(0, clamp(marker) - 0.5))} y="0" width="1" height="10" />}
    </svg>
  );
}
