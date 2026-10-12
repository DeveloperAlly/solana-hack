import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderPersonaCard.example';

describe('BuilderPersonaCard', () => {
  it('edits, validates and removes a persona, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByText('Assumption')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Edit [Persona 1 name]' }));
    const pain = screen.getByLabelText('Pain ([Persona 1 name])');
    await userEvent.clear(pain);
    await userEvent.type(pain, 'Loses context');
    await expectNoAxeViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Pain: Loses context')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Mark [Persona 1 name] validated' }));
    expect(screen.getByText('Validated')).toBeInTheDocument();
    expect(screen.queryByText('Assumption')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove [Persona 1 name]' }));
    expect(screen.getByText('No personas.')).toBeInTheDocument();
  });
});
