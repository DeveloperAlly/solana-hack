import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderScale.example';

describe('BuilderScale', () => {
  it('moves the dial, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    const group = screen.getByRole('group', { name: 'Formality' });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /^2 of 5/ })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: /^4 of 5/ }));
    expect(screen.getByRole('radio', { name: /^4 of 5/ })).toBeChecked();
    await expectNoAxeViolations(container);
  });
});
