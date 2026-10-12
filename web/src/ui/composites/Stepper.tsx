import { Link as RouterLink } from 'react-router';
import styles from './Stepper.module.css';

export interface StepperStep {
  label: string;
}

export interface StepperProps {
  steps: StepperStep[];
  /** Index of the current step (0-based). Steps before it are done. */
  current: number;
  orientation?: 'horizontal' | 'vertical';
  /** Makes completed steps clickable: return the path for a done step. */
  hrefFor?: (index: number) => string | undefined;
  /** Accessible name of the step list. */
  label?: string;
}

/** C8 Stepper: done / current / todo steps, horizontal or vertical; completed steps can be links. */
export function Stepper({ steps, current, orientation = 'horizontal', hrefFor, label = 'Progress' }: StepperProps) {
  return (
    <ol className={`${styles.steps} ${styles[orientation]}`} aria-label={label}>
      {steps.map((s, i) => {
        const status = i < current ? 'done' : i === current ? 'current' : 'todo';
        const href = status === 'done' ? hrefFor?.(i) : undefined;
        const text = (
          <>
            <span className={styles.num} aria-hidden="true">{i + 1}</span> {s.label}
            {status === 'done' && <span className="wl-visually-hidden"> (done)</span>}
          </>
        );
        return (
          <li key={s.label} className={`${styles.step} ${styles[status]}`} aria-current={status === 'current' ? 'step' : undefined}>
            {href ? <RouterLink to={href} className={styles.link}>{text}</RouterLink> : text}
          </li>
        );
      })}
    </ol>
  );
}
