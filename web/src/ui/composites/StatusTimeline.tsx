import type { ReactNode } from 'react';
import { Icon } from '../primitives/Icon';
import styles from './StatusTimeline.module.css';

export type TimelineStepState = 'done' | 'current' | 'failed' | 'todo';

export interface TimelineStep {
  label: string;
  state: TimelineStepState;
  /** Time or short detail under the label ("16:21", "Usually under a minute"). */
  note?: string;
  /** A link or button after the note (View on LinkedIn, Receipt). */
  action?: ReactNode;
}

export interface StatusTimelineProps {
  steps: TimelineStep[];
  orientation?: 'horizontal' | 'vertical';
  /** Accessible name of the list (default "Status"). */
  label?: string;
}

const spoken: Record<TimelineStepState, string> = { done: 'done', current: 'in progress', failed: 'failed', todo: 'not started' };

/**
 * C9 StatusTimeline: steps that are each done, current, failed or to do, with a note and an optional action;
 * horizontal or vertical. Unlike C8 Stepper (a wizard's position, derived from one index), each step carries its own
 * state, so a step can fail. D29 PayoutStatus is a preset of it (Published, Verifying, Approved, Paid).
 * Replaces AmbStatusTimeline (issue #46, shared consolidation).
 */
export function StatusTimeline({ steps, orientation = 'horizontal', label = 'Status' }: StatusTimelineProps) {
  return (
    <ol className={`${styles.list} ${styles[orientation]}`} aria-label={label}>
      {steps.map((s) => (
        <li key={s.label} className={`${styles.step} ${styles[s.state]}`} aria-current={s.state === 'current' || s.state === 'failed' ? 'step' : undefined}>
          <span className={styles.label}>
            {s.label}
            {s.state === 'done' && <Icon name="check" size="sm" />}
            <span className="wl-visually-hidden"> ({spoken[s.state]})</span>
          </span>
          {(s.note || s.action != null) && (
            <span className={styles.note}>
              {s.note}
              {s.note && s.action != null && ' · '}
              {s.action}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
