import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './EventPlanPhase.example';

describe('D97 EventPlanPhase', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await expectNoAxeViolations(container);
  });

  it('names each phase and lists its items with status and action', () => {
    renderWithRouter(example.render());
    const live = screen.getByRole('region', { name: 'Live' });
    expect(within(live).getAllByRole('listitem')).toHaveLength(2);
    expect(within(live).getByRole('link', { name: 'Brief' })).toBeInTheDocument();
    const recap = screen.getByRole('region', { name: 'Recap' });
    expect(within(recap).queryByRole('link')).toBeNull();
    expect(within(screen.getByRole('region', { name: 'Announce (not drafted)' })).getByRole('button', { name: 'Draft the post' })).toBeInTheDocument();
  });
});
