import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderChoiceCards.example';

describe('BuilderChoiceCards', () => {
  it('selects one card at a time, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('group', { name: 'Type' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Company/ })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: /Person/ }));
    expect(screen.getByRole('radio', { name: /Person/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Company/ })).not.toBeChecked();
    await expectNoAxeViolations(container);
  });
});
