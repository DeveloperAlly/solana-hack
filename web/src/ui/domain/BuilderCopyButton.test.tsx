import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderCopyButton.example';

describe('BuilderCopyButton', () => {
  it('copies the value and says so, with no axe violations', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const { container } = renderWithRouter(example.render());
    await user.click(screen.getByRole('button', { name: 'Copy value' }));
    expect(writeText).toHaveBeenCalledWith('jamjam-verify=[unique value]');
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    await expectNoAxeViolations(container);
  });
  it('says when copying fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    renderWithRouter(example.render());
    await user.click(screen.getByRole('button', { name: 'Copy value' }));
    expect(screen.getByRole('status')).toHaveTextContent('Copy failed');
  });
});
