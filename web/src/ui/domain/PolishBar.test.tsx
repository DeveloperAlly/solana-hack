import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { PolishBar } from './PolishBar';
import { example } from './PolishBar.example';

const actions = [{ id: 'shorten', label: 'Shorten' }, { id: 'clarify', label: 'Clarify' }];

describe('D6 PolishBar', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('alert')).toHaveTextContent("Beautify didn't finish.");
    expect(screen.getByRole('checkbox', { name: /Accessible mode/ })).toBeChecked();
    await expectNoAxeViolations(container);
  });

  it('applies, presses and announces the last action, and undoes it', async () => {
    renderWithRouter(example.render());
    const group = screen.getAllByRole('group', { name: 'Polish actions' })[0];
    expect(within(group).getByRole('button', { name: 'Shorten' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(within(group).getByRole('button', { name: 'Clarify' }));
    expect(within(group).getByRole('button', { name: 'Clarify' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('Clarify applied (2 changes)');
    await userEvent.click(screen.getByRole('button', { name: 'Undo Clarify' }));
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('Shorten applied');
  });

  it('retries or dismisses a failure, and disables actions while busy', async () => {
    const onRetry = vi.fn();
    const onDismiss = vi.fn();
    const { rerender } = renderWithRouter(<PolishBar actions={actions} applied={[]} onApply={() => undefined} failure={{ id: 'clarify', onRetry, onDismiss }} />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry Clarify' }));
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onRetry).toHaveBeenCalled();
    expect(onDismiss).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Clarify' })).toHaveAttribute('aria-pressed', 'false');
    rerender(<PolishBar actions={actions} applied={['shorten']} onApply={() => undefined} failure={{ id: 'clarify', onRetry, onDismiss }} />);
    expect(screen.getByRole('button', { name: 'Shorten' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Clarify' })).toHaveAttribute('aria-pressed', 'false');
    rerender(<PolishBar actions={actions} applied={[]} onApply={() => undefined} busy />);
    expect(screen.getByRole('button', { name: 'Shorten' })).toBeDisabled();
  });
});
