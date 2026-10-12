import { Link as RouterLink } from 'react-router';
import styles from './DemoStateSwitcher.module.css';

export const screenStates = ['success', 'empty', 'loading', 'error'] as const;
export type ScreenState = (typeof screenStates)[number];

const stateLabels: Record<ScreenState, string> = { success: 'Success', empty: 'Empty', loading: 'Loading', error: 'Error' };

export interface DemoStateSwitcherProps {
  /** States this screen supports, in display order. */
  states: readonly ScreenState[];
  value: ScreenState;
  /** Link for a state (the gallery puts it in ?state=), so each state has its own URL for demos and recordings. */
  hrefFor: (state: ScreenState) => string;
  /** Renders nothing outside demo mode. */
  demo?: boolean;
}

/** C28 DemoStateSwitcher: jump between a screen's states (replaces the canvas "Prototype" notes); hidden outside demo mode. */
export function DemoStateSwitcher({ states, value, hrefFor, demo = true }: DemoStateSwitcherProps) {
  if (!demo) return null;
  return (
    <nav aria-label="Screen state" className={styles.bar}>
      <span className={styles.label} aria-hidden="true">State</span>
      <ul className={styles.list}>
        {states.map((s) => (
          <li key={s}>
            <RouterLink to={hrefFor(s)} aria-current={s === value ? 'true' : undefined} className={[styles.item, s === value && styles.active].filter(Boolean).join(' ')}>
              {stateLabels[s]}
            </RouterLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
