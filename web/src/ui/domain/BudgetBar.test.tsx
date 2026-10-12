import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { BudgetBar, budgetLevel } from './BudgetBar';
import { example } from './BudgetBar.example';

describe('D25 BudgetBar', () => {
  it('renders every example state with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByText('305 of 500 USDC left')).toBeInTheDocument();
    expect(screen.getByText('500 of 500 USDC paid out')).toBeInTheDocument();
    expect(screen.getAllByText('Under 20% of the budget is left.')).toHaveLength(1);
    await expectNoAxeViolations(container);
  });

  it('summarises spent, committed and remaining for assistive tech', () => {
    renderWithRouter(<BudgetBar budget={{ spent: 135, committed: 60, cap: 500, unit: 'USDC' }} />);
    expect(screen.getByRole('img', { name: 'Budget: Spent 27%, Committed 12%, Remaining 61%' })).toBeInTheDocument();
  });

  it.each([
    [{ spent: 0, cap: 500, unit: 'USDC' }, 'empty'],
    [{ spent: 100, committed: 50, cap: 500, unit: 'USDC' }, 'ok'],
    [{ spent: 420, cap: 500, unit: 'USDC' }, 'near'],
    [{ spent: 400, committed: 100, cap: 500, unit: 'USDC' }, 'full'],
  ] as const)('budgetLevel(%o) is %s', (budget, level) => {
    expect(budgetLevel(budget)).toBe(level);
  });
});
