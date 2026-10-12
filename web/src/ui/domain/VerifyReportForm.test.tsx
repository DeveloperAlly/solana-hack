import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoAxeViolations } from '../../test/axe';
import { VerifyReportForm } from './VerifyReportForm';
import { VerifyReportFormDemo } from './VerifyReportForm.example';

describe('VerifyReportForm', () => {
  it('opens, validates, sends and confirms', async () => {
    const onSubmit = vi.fn();
    render(<VerifyReportForm triggerLabel="Report possible impersonation" onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Report possible impersonation' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send report' }));
    expect(screen.getByText('Name the brand it claims to be from.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText('Which brand does it claim to be from?'), 'aDNA');
    await userEvent.type(screen.getByLabelText(/Where did you see it/), 'linkedin.com/company/acme');
    await userEvent.click(screen.getByRole('button', { name: 'Send report' }));
    expect(onSubmit).toHaveBeenCalledWith({ brand: 'aDNA', where: 'linkedin.com/company/acme', details: '' });
    expect(screen.getByText('Report sent')).toBeInTheDocument();
  });
  it('Cancel closes the form', async () => {
    render(<VerifyReportForm triggerLabel="Report to aDNA" brandName="aDNA" defaultOpen />);
    expect(screen.getByLabelText('Which brand does it claim to be from?')).toHaveValue('aDNA');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Report to aDNA' })).toBeInTheDocument();
  });
  it('has no axe violations', async () => {
    const { container } = render(<VerifyReportFormDemo />);
    await expectNoAxeViolations(container);
  });
});
