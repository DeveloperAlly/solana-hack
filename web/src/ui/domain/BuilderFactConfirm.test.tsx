import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderFactConfirm.example';

describe('BuilderFactConfirm', () => {
  it('confirms, changes and rejects a fact, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await userEvent.click(screen.getByRole('button', { name: "That's right" }));
    expect(screen.getByRole('status')).toHaveTextContent('Confirmed');
    expect(screen.getByText('jamjam.tech · confirmed')).toBeInTheDocument();
    await expectNoAxeViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Change' }));
    await userEvent.click(screen.getByRole('button', { name: 'Not quite' }));
    expect(screen.getByRole('status')).toHaveTextContent("We won't use it");
  });
});
