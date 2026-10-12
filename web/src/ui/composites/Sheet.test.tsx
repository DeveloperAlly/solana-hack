import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './Sheet.example';

describe('C18 Sheet', () => {
  it('opens as a labelled modal dialog with no axe violations, and closes on Escape with focus back on the opener', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.queryByRole('dialog')).toBeNull();
    const opener = screen.getByRole('button', { name: 'Show 3 flags' });
    await userEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: '3 flags' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveFocus();
    await expectNoAxeViolations(container);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('keeps Tab inside the panel', async () => {
    renderWithRouter(example.render());
    await userEvent.click(screen.getByRole('button', { name: 'Show 3 flags' }));
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Apply all fixes' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });
});
