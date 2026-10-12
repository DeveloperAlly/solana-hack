import type { ReactNode } from 'react';
import { Badge } from '../primitives/Badge';
import { Meter } from '../composites/Meter';
import styles from './AmbOnBrandMeter.module.css';

export interface AmbOnBrandMeterProps {
  /** On-brand score, 0–100. */
  score: number;
  /** Publish threshold, 0–100 (80 on the canvas). */
  threshold: number;
  /** `panel`: big number with the heading (desktop rail). `bar`: one line plus the bar (mobile, pinned at the top). */
  layout?: 'panel' | 'bar';
  /** Explains the threshold under the bar. */
  hint?: string;
  /** Extra control on the summary line (the mobile "3 flags" button). */
  action?: ReactNode;
  /** Whether the score blocks publishing, when the caller's checks decide it; defaults to score below threshold. */
  below?: boolean;
}

/**
 * D4 VoiceFitMeter: the page's preset of the shared P25 Meter: the on-brand score with the publish threshold marked,
 * a Drifting / On brand chip and an optional action. States: below (Drifting), at or above (On brand).
 */
export function AmbOnBrandMeter({ score, threshold, layout = 'panel', hint, action, below = score < threshold }: AmbOnBrandMeterProps) {
  const summary = (
    <span className={`${styles.summary} ${styles[layout]}`}>
      {layout === 'panel' ? <strong className={styles.big}>{score}%</strong> : <strong>On-brand {score}%</strong>}
      <Badge tone={below ? 'neutral' : 'solid'}>{below ? 'Drifting' : 'On brand'}</Badge>
      {action && <span className={styles.action}>{action}</span>}
    </span>
  );
  return <Meter label="On-brand score" value={score} threshold={threshold} valueText={`${score}%, publishing unlocks at ${threshold}%`} summary={summary} hint={hint} />;
}
