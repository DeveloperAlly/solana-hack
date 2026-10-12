import type { ReactNode } from 'react';
import { Badge } from '../primitives/Badge';
import { AmbBar } from './AmbBar';
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

/** D4 VoiceFitMeter: the on-brand score as a labelled meter with the publish threshold marked. States: below (Drifting), at or above (On brand). */
export function AmbOnBrandMeter({ score, threshold, layout = 'panel', hint, action, below = score < threshold }: AmbOnBrandMeterProps) {
  const chip = <Badge tone={below ? 'neutral' : 'solid'}>{below ? 'Drifting' : 'On brand'}</Badge>;
  return (
    <div className={`${styles.root} ${styles[layout]}`}>
      <div className={styles.summary}>
        {layout === 'panel' ? <strong className={styles.big}>{score}%</strong> : <strong>On-brand {score}%</strong>}
        {chip}
        {action && <span className={styles.action}>{action}</span>}
      </div>
      <div role="meter" aria-label="On-brand score" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${score}%, publishing unlocks at ${threshold}%`}>
        <AmbBar segments={[{ pct: score, tone: 'primary' }]} marker={threshold} />
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
