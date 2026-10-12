import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './EventRatingFields.example';

describe('D103 EventRatingFields', () => {
  it('renders locked and open with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await expectNoAxeViolations(container);
  });

  it('locked disables every question; no score is pre-selected; Register waits for all five', async () => {
    renderWithRouter(example.render());
    const [locked, open] = screen.getAllByRole('group');
    expect(within(locked).getByLabelText('Talks worth it')).toBeDisabled();
    for (const s of within(open).getAllByRole('combobox')) expect(s).toHaveValue('');
    const register = screen.getAllByRole('button', { name: 'Register my rating' })[1];
    for (const label of ['Talks worth it', 'Well run', 'Right people', 'Sponsor value']) {
      await userEvent.selectOptions(within(open).getByLabelText(label), '4');
      expect(register).toBeDisabled();
    }
    await userEvent.selectOptions(within(open).getByLabelText('Would go again'), '5');
    expect(register).toBeEnabled();
  });
});
