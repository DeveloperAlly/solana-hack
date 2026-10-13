import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './QuestCard.example';

describe('D53 QuestCard', () => {
  it('renders every state with no axe violations, each with its chip', async () => {
    const { container } = renderWithRouter(example.render());
    expect(within(screen.getByRole('region', { name: /event recap/ })).getByText('Coming soon')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: /tutorial/ })).getByText('Open')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: /setup questions/ })).getByText('2 to review')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: /demo/ })).getByText('Paid · budget reached')).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });
});
