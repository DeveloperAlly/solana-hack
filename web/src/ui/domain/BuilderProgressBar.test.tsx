import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderProgressBar.example';

describe('BuilderProgressBar', () => {
  it('renders a progressbar and a labelled segmented bar, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('progressbar', { name: 'Reading progress' })).toHaveAttribute('value', '50');
    expect(screen.getByRole('img', { name: 'Budget: Spent 27%, Committed 12%' })).toBeInTheDocument();
    expect(screen.getByText('135 spent · 60 committed · 305 left of 500 USDC')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
