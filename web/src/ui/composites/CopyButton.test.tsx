import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { CopyButton } from './CopyButton';
import { example } from './CopyButton.example';

afterEach(() => vi.restoreAllMocks());

describe('C13 CopyButton', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getAllByRole('button')).toHaveLength(3);
    await expectNoAxeViolations(container);
  });

  it('copies the value and shows a visible status (status feedback)', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const onCopy = vi.fn();
    const { container } = renderWithRouter(<CopyButton value="abc" label="Copy value" onCopy={onCopy} />);
    await user.click(screen.getByRole('button', { name: 'Copy value' }));
    expect(writeText).toHaveBeenCalledWith('abc');
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    expect(screen.getByRole('button', { name: 'Copy value' })).toBeInTheDocument();
    expect(onCopy).toHaveBeenCalledWith('copied');
    await expectNoAxeViolations(container);
  });

  it('says when copying fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    renderWithRouter(<CopyButton value="abc" label="Copy value" />);
    await user.click(screen.getByRole('button', { name: 'Copy value' }));
    expect(screen.getByRole('status')).toHaveTextContent('Copy failed: select and copy it by hand');
  });

  it('changes the button text and announces the longer message (label feedback)', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    renderWithRouter(<CopyButton value="abc" label="Copy endpoint" feedback="label" messages={{ failed: 'Could not copy. Select the text and copy it yourself.' }} />);
    await user.click(screen.getByRole('button', { name: 'Copy endpoint' }));
    expect(screen.getByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Could not copy.');
    expect(screen.getByRole('status')).toHaveClass('wl-visually-hidden');
  });
});
