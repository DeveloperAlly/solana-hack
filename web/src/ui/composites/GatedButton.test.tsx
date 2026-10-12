import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { GatedButton } from './GatedButton';
import { example } from './GatedButton.example';

describe('C36 GatedButton', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await expectNoAxeViolations(container);
  });

  it('a blocking gate disables the button and describes it with the reason', async () => {
    const onClick = vi.fn();
    renderWithRouter(<GatedButton gate={{ blocking: true, label: 'Choose all five ratings first.' }} onClick={onClick}>Register</GatedButton>);
    const button = screen.getByRole('button', { name: 'Register' });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription('Choose all five ratings first.');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('an open gate runs the action; a blocked link is never a live link', async () => {
    const onClick = vi.fn();
    const { rerender } = renderWithRouter(<GatedButton gate={{ blocking: false, label: 'Ready.' }} onClick={onClick}>Go</GatedButton>);
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    rerender(<GatedButton gate={{ blocking: true, label: 'Not yet.' }} href="/somewhere">Open</GatedButton>);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open' })).toBeDisabled();
  });
});
