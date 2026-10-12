import { ProgressBar } from '../composites/ProgressBar';
import styles from './BudgetBar.module.css';

export interface Budget {
  /** Paid out so far. */
  spent: number;
  /** Awaiting approval: committed but not paid. */
  committed?: number;
  cap: number;
  /** "USDC". */
  unit: string;
}

export interface BudgetBarProps {
  budget: Budget;
  /** Replaces the default "N of cap unit left" caption (e.g. "500 of 500 USDC paid out"). */
  caption?: string;
  /** Accessible name of the bar (default "Budget"). */
  label?: string;
}

/** Remaining share under which the bar warns (canvas note n-a2: "Budget bar warns when under 20% remains"). */
export const BUDGET_WARN_SHARE = 0.2;

export type BudgetLevel = 'empty' | 'ok' | 'near' | 'full';

export function budgetLevel({ spent, committed = 0, cap }: Budget): BudgetLevel {
  const left = cap - spent - committed;
  if (left <= 0) return 'full';
  if (spent + committed === 0) return 'empty';
  return left / cap < BUDGET_WARN_SHARE ? 'near' : 'ok';
}

const pct = (n: number, cap: number) => (cap > 0 ? (n / cap) * 100 : 0);

/**
 * D25 BudgetBar: a P24 ProgressBar preset of spent / committed / remaining against the cap, with a caption.
 * States: empty, ok, near cap (warns), full. Replaces AmbBudgetBar (issue #46, shared consolidation); used by
 * Dashboard, Amb-2-Detail and Hub-Home (component inventory D25).
 */
export function BudgetBar({ budget, caption, label = 'Budget' }: BudgetBarProps) {
  const { spent, committed = 0, cap, unit } = budget;
  const level = budgetLevel(budget);
  const left = Math.max(0, cap - spent - committed);
  return (
    <div className={styles.root} data-level={level}>
      <ProgressBar
        label={label}
        overflowLabel="Over budget by"
        segments={[{ value: pct(spent, cap), label: 'Spent' }, { value: pct(committed, cap), label: 'Committed', tone: 'secondary' }]}
        caption={caption ?? `${left} of ${cap} ${unit} left`}
      />
      {level === 'near' && <p className={styles.warn}>Under {BUDGET_WARN_SHARE * 100}% of the budget is left.</p>}
    </div>
  );
}
