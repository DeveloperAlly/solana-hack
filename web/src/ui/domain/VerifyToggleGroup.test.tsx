import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { VerifyToggleGroupDemo } from './VerifyToggleGroup.example';

describe('C5 VerifyToggleGroup', () => {
  it('presses one option at a time', async () => {
    renderWithRouter(<VerifyToggleGroupDemo />);
    expect(screen.getByRole('group', { name: 'Filter by type' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Kits' }));
    expect(screen.getByRole('button', { name: 'Kits' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');
  });
  it('has no axe violations', async () => {
    const { container } = renderWithRouter(<VerifyToggleGroupDemo />);
    await expectNoAxeViolations(container);
  });
});
