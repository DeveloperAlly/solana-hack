import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { DistributeVersionCard } from './DistributeVersionCard';
import { example } from './DistributeVersionCard.example';

const needs = { label: 'Needs your approval', tone: 'neutral' as const, approved: false };

describe('D92 DistributeVersionCard', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await expectNoAxeViolations(container);
  });

  it('a blocking check shows the blocked badge and disables Approve', () => {
    renderWithRouter(<DistributeVersionCard platform="X" text="t" length={{ used: 290, max: 280 }} check={{ blocking: true, label: '10 over the limit' }} approval={needs} onSave={() => undefined} onApprove={() => undefined} />);
    expect(screen.getByText('Blocked: 10 over the limit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve X' })).toBeDisabled();
    expect(screen.getByText('290 / 280')).toBeInTheDocument();
  });

  it('edits in place and saves the new text; approves when the check passes', async () => {
    const onSave = vi.fn();
    const onApprove = vi.fn();
    renderWithRouter(<DistributeVersionCard platform="LinkedIn" text="Old" length={null} check={{ blocking: false, label: 'Checks passed' }} approval={needs} onSave={onSave} onApprove={onApprove} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit LinkedIn version' }));
    const box = screen.getByLabelText('LinkedIn version');
    await userEvent.clear(box);
    await userEvent.type(box, 'New');
    await userEvent.click(screen.getByRole('button', { name: 'Save LinkedIn version' }));
    expect(onSave).toHaveBeenCalledWith('New');
    await userEvent.click(screen.getByRole('button', { name: 'Approve LinkedIn' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('an approved version shows no Approve button', () => {
    renderWithRouter(<DistributeVersionCard platform="X" text="t" length={null} check={{ blocking: false, label: 'Checks passed' }} approval={{ label: 'Approved', tone: 'solid', approved: true }} onSave={() => undefined} onApprove={() => undefined} />);
    expect(screen.queryByRole('button', { name: 'Approve X' })).toBeNull();
  });
});
