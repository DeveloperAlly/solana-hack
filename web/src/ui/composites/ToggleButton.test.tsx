import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './ToggleButton.example';

describe('C34 ToggleButton', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('button', { name: "We'll email you about film.fun" })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Notify me about GamersLab' })).toBeDisabled();
    await expectNoAxeViolations(container);
  });

  it('toggles its pressed state and label', async () => {
    renderWithRouter(example.render());
    const button = screen.getByRole('button', { name: 'Notify me about aDNA' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(button);
    expect(screen.getByRole('button', { name: "We'll email you about aDNA" })).toHaveAttribute('aria-pressed', 'true');
  });
});
