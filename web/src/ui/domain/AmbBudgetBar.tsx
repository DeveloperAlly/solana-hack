import { AmbBar } from './AmbBar';
import styles from './AmbBudgetBar.module.css';

export interface AmbBudget {
  /** Paid out so far. */
  spent: number;
  /** Awaiting approval: committed but not paid. */
  committed?: number;
  cap: number;
  unit: string;
}

export interface AmbBudgetBarProps {
  budget: AmbBudget;
  /** Replaces the default "N of cap unit left" caption (e.g. "500 of 500 USDC paid out"). */
  caption?: string;
}

/** Remaining share under which the bar warns (canvas note n-a2: "Budget bar warns when under 20% remains"). */
export const AMB_BUDGET_WARN_SHARE = 0.2;

export type AmbBudgetLevel = 'empty' | 'ok' | 'near' | 'full';

export function budgetLevel({ spent, committed = 0, cap }: AmbBudget): AmbBudgetLevel {
  const left = cap - spent - committed;
  if (left <= 0) return 'full';
  if (spent + committed === 0) return 'empty';
  return left / cap < AMB_BUDGET_WARN_SHARE ? 'near' : 'ok';
}

const pct = (n: number, cap: number) => (cap > 0 ? (n / cap) * 100 : 0);

/** D25 BudgetBar: spent / committed / remaining against the cap, with a caption. States: empty, ok, near cap (warns), full. */
export function AmbBudgetBar({ budget, caption }: AmbBudgetBarProps) {
  const { spent, committed = 0, cap, unit } = budget;
  const level = budgetLevel(budget);
  const left = Math.max(0, cap - spent - committed);
  return (
    <div className={styles.root} data-level={level}>
      <AmbBar segments={[{ pct: pct(spent, cap), tone: 'primary' }, { pct: pct(committed, cap), tone: 'secondary' }]} />
      <p className={styles.caption}>{caption ?? `${left} of ${cap} ${unit} left`}</p>
      {level === 'near' && <p className={styles.warn}>Under 20% of the budget is left.</p>}
    </div>
  );
}
