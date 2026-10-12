import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderSignInForm.example';
import { BuilderSignInForm } from './BuilderSignInForm';

describe('BuilderSignInForm', () => {
  it('checks the email and the code on the client, then signs in, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await userEvent.type(screen.getByLabelText('Work email'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Send code' }));
    expect(screen.getByLabelText('Work email')).toHaveAttribute('aria-invalid', 'true');
    await userEvent.clear(screen.getByLabelText('Work email'));
    await userEvent.type(screen.getByLabelText('Work email'), 'you@jamjam.tech');
    await userEvent.click(screen.getByRole('button', { name: 'Send code' }));
    expect(screen.getByText('Code sent to you@jamjam.tech.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Enter the code we sent'), '12a4');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('alert')).toHaveTextContent('6 to 10 digits');
    await expectNoAxeViolations(container);
    await userEvent.clear(screen.getByLabelText('Enter the code we sent'));
    await userEvent.type(screen.getByLabelText('Enter the code we sent'), '12345678');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Signed in as you@jamjam.tech')).toBeInTheDocument();
  });
  it('shows the sending, wrong-code and expired-link states', () => {
    const onVerified = vi.fn();
    renderWithRouter(<BuilderSignInForm resendNote="r" phase="sending" onVerified={onVerified} />);
    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  });
  it('shows the expired link and a wrong code', () => {
    renderWithRouter(<BuilderSignInForm resendNote="r" phase="expired" initialCodeError="That code is wrong." onVerified={vi.fn()} />);
    expect(screen.getAllByRole('alert').map((a) => a.textContent).join(' ')).toMatch(/expired or was already used.*That code is wrong/);
  });
});
