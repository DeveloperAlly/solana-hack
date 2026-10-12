import type { ReactNode } from 'react';
import { Icon } from '../primitives/Icon';
import styles from './AmbStatusTimeline.module.css';

export type AmbStepState = 'done' | 'current' | 'failed' | 'todo';

export interface AmbTimelineStep {
  label: string;
  state: AmbStepState;
  /** Time or short detail under the label ("16:21", "Usually under a minute"). */
  note?: string;
  /** A link or button after the note (View on LinkedIn, Receipt). */
  action?: ReactNode;
}

export interface AmbStatusTimelineProps {
  steps: AmbTimelineStep[];
  orientation?: 'horizontal' | 'vertical';
  /** Accessible name of the list. */
  label?: string;
}

const spoken: Record<AmbStepState, string> = { done: 'done', current: 'in progress', failed: 'failed', todo: 'not started' };

/**
 * C9 StatusTimeline, D29 PayoutStatus preset (Published, Verifying, Approved, Paid): each step done, current, failed
 * or to do, with a note and an optional action; horizontal on desktop, vertical on mobile (canvas note n-m5).
 */
export function AmbStatusTimeline({ steps, orientation = 'horizontal', label = 'Post status' }: AmbStatusTimelineProps) {
  return (
    <ol className={`${styles.list} ${styles[orientation]}`} aria-label={label}>
      {steps.map((s) => (
        <li key={s.label} className={`${styles.step} ${styles[s.state]}`} aria-current={s.state === 'current' || s.state === 'failed' ? 'step' : undefined}>
          <span className={styles.label}>
            {s.label}
            {s.state === 'done' && <Icon name="check" size="sm" />}
            <span className="wl-visually-hidden"> ({spoken[s.state]})</span>
          </span>
          {(s.note || s.action) && (
            <span className={styles.note}>
              {s.note}
              {s.note && s.action && ' · '}
              {s.action}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
