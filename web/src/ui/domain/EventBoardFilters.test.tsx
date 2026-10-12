import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './EventBoardFilters.example';

describe('D104 EventBoardFilters', () => {
  it('renders with no axe violations and reports changes', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('status')).toHaveTextContent('4 events');
    await userEvent.type(screen.getByLabelText('Search events'), 'city');
    expect(screen.getByRole('status')).toHaveTextContent('1 event');
    await userEvent.selectOptions(screen.getByLabelText('Sort'), 'lowest');
    expect(screen.getByLabelText('Sort')).toHaveValue('lowest');
    await expectNoAxeViolations(container);
  });
});
