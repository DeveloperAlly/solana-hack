import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { DecisionGate } from './DecisionGate';
import { example } from './DecisionGate.example';

const now = () => 'T';

describe('D17 DecisionGate', () => {
  it('renders every example variant with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    expect(screen.getByRole('button', { name: 'Approve purpose' })).toBeInTheDocument();
    expect(screen.getByText(/Approved by \[owner email\]/)).toBeInTheDocument();
    await expectNoAxeViolations(container);
  });

  it('full: approve records who, when and why', async () => {
    const onDecide = vi.fn();
    renderWithRouter(<DecisionGate subject="purpose" approver="me" decision={{ status: 'pending' }} onDecide={onDecide} now={now}>draft</DecisionGate>);
    await userEvent.type(screen.getByRole('textbox', { name: 'Why (optional)' }), ' clear ');
    await userEvent.click(screen.getByRole('button', { name: 'Approve purpose' }));
    expect(onDecide).toHaveBeenCalledWith({ status: 'approved', by: 'me', at: 'T', why: 'clear' });
  });

  it('full: a change request needs a note', async () => {
    const onDecide = vi.fn();
    renderWithRouter(<DecisionGate subject="purpose" approver="me" decision={{ status: 'pending' }} onDecide={onDecide}>draft</DecisionGate>);
    await userEvent.click(screen.getByRole('button', { name: 'Request changes' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Say what should change');
    await userEvent.type(screen.getByRole('textbox', { name: 'What should change?' }), 'Shorter');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(onDecide).toHaveBeenCalledWith({ status: 'changes', note: 'Shorter' });
  });

  it('full: Cancel clears the whole request-changes form, note and error', async () => {
    renderWithRouter(<DecisionGate subject="purpose" approver="me" decision={{ status: 'pending' }} onDecide={vi.fn()}>draft</DecisionGate>);
    await userEvent.click(screen.getByRole('button', { name: 'Request changes' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'What should change?' }), 'Half a thought');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Request changes' }));
    expect(screen.getByRole('textbox', { name: 'What should change?' })).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('full: a stale approval asks to be approved again', async () => {
    const onDecide = vi.fn();
    renderWithRouter(<DecisionGate subject="voice" approver="me" decision={{ status: 'stale', by: 'me', at: 'T' }} onDecide={onDecide} now={now}>draft</DecisionGate>);
    expect(screen.getByRole('alert')).toHaveTextContent('Needs a fresh approval');
    await userEvent.click(screen.getByRole('button', { name: 'Approve voice' }));
    expect(onDecide).toHaveBeenCalledWith({ status: 'approved', by: 'me', at: 'T', why: undefined });
  });

  it('full: approved shows the record and Reopen; deferred and changes show their notices', async () => {
    const onDecide = vi.fn();
    const { rerender } = renderWithRouter(<DecisionGate subject="purpose" approver="me" decision={{ status: 'approved', by: 'me', at: 'T' }} onDecide={onDecide}>draft</DecisionGate>);
    expect(screen.getByText('Purpose approved')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reopen' }));
    expect(onDecide).toHaveBeenCalledWith({ status: 'pending' });
    rerender(<DecisionGate subject="purpose" approver="me" decision={{ status: 'deferred' }} onDecide={onDecide}>draft</DecisionGate>);
    expect(screen.getByText('Saved, not decided')).toBeInTheDocument();
  });

  it('compact: Approve can be disabled (while editing) and Change reopens', async () => {
    const onDecide = vi.fn();
    const { rerender } = renderWithRouter(<DecisionGate variant="compact" gate={1} title="Purpose" subject="purpose" approver="me" decision={{ status: 'pending' }} onDecide={onDecide} approveDisabled>draft</DecisionGate>);
    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled();
    rerender(<DecisionGate variant="compact" gate={1} title="Purpose" subject="purpose" approver="me" decision={{ status: 'approved', by: 'me', at: 'T' }} onDecide={onDecide}>draft</DecisionGate>);
    await userEvent.click(screen.getByRole('button', { name: 'Change' }));
    expect(onDecide).toHaveBeenCalledWith({ status: 'pending' });
  });
});
