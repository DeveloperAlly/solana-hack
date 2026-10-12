import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { DashboardApproval, approvalView } from './DashboardApproval';
import type { ApprovalStatus } from './types';

// Submission from canvas board Dashboard (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50). Sample data.
const submission = { id: 's1', kind: 'LinkedIn post', author: 'Mai T.', amount: '10 USDC', excerpt: 'My coding agent lost a full day of work last week. Not the code. The context…', checks: ['On-brand 91%', 'Verified on LinkedIn'], link: { label: 'Open post', href: '/x' } };
const example = { render: () => <ul className="wl-list"><DashboardApproval item={submission} /></ul> };

describe('DashboardApproval', () => {
  it('pays only after approval, once, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('button', { name: 'Pay (owner only)' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(screen.getByRole('status')).toHaveTextContent('Approved · not paid yet');
    await userEvent.click(screen.getByRole('button', { name: 'Pay (owner only)' }));
    expect(screen.getByRole('status')).toHaveTextContent('Paid');
    expect(screen.getByRole('button', { name: 'Pay (owner only)' })).toBeDisabled();
    await expectNoAxeViolations(container);
  });
  it('Cancel clears the whole rejection form, reason and error', async () => {
    renderWithRouter(example.render());
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send rejection' }));
    await userEvent.type(screen.getByLabelText(/Reason for rejecting/), 'draft');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
    expect(screen.getByLabelText(/Reason for rejecting/)).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('rejects with a required reason', async () => {
    renderWithRouter(example.render());
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send rejection' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Give a reason');
    await userEvent.type(screen.getByLabelText(/Reason for rejecting/), 'Off-brand claim');
    await userEvent.click(screen.getByRole('button', { name: 'Send rejection' }));
    expect(screen.getByRole('status')).toHaveTextContent('Rejected: Off-brand claim');
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
  });
  it.each(Object.keys(approvalView) as ApprovalStatus[])('status %s: the status line and the enabled actions come from one table', (status) => {
    renderWithRouter(<ul><DashboardApproval item={submission} defaultStatus={status} /></ul>);
    const v = approvalView[status];
    expect(screen.getByRole('status')).toHaveTextContent(v.label);
    expect(screen.getByRole('button', { name: 'Approve' })).toHaveProperty('disabled', !v.approve);
    expect(screen.getByRole('button', { name: 'Reject' })).toHaveProperty('disabled', !v.reject);
    expect(screen.getByRole('button', { name: 'Pay (owner only)' })).toHaveProperty('disabled', !v.pay);
  });
});
