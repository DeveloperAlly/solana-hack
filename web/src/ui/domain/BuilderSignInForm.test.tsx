import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderSignInForm.example';
import { BuilderSignInForm } from './BuilderSignInForm';

const email = () => screen.getByLabelText('Work email');
const code = () => screen.getByLabelText('Enter the code we sent');

describe('BuilderSignInForm', () => {
  it('checks the email and the code on the client, then signs in, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await userEvent.type(email(), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Send code' }));
    expect(email()).toHaveAttribute('aria-invalid', 'true');
    await userEvent.clear(email());
    await userEvent.type(email(), 'you@jamjam.tech');
    await userEvent.click(screen.getByRole('button', { name: 'Send code' }));
    expect(screen.getByText('Code sent to you@jamjam.tech.')).toBeInTheDocument();
    await userEvent.type(code(), '12a4');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('alert')).toHaveTextContent('6 to 10 digits');
    await expectNoAxeViolations(container);
    await userEvent.clear(code());
    await userEvent.type(code(), '12345678');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText('Signed in as you@jamjam.tech')).toBeInTheDocument();
  });

  it('rejects a code entered before any code was sent, and after the email changes', async () => {
    const onVerified = vi.fn();
    renderWithRouter(<BuilderSignInForm defaultEmail="you@jamjam.tech" resendNote="r" onVerified={onVerified} />);
    await userEvent.type(code(), '12345678');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Send a code to your email first.');
    await userEvent.click(screen.getByRole('button', { name: 'Send code' }));
    await userEvent.type(email(), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Send a code to your email first.');
    expect(onVerified).not.toHaveBeenCalled();
  });

  it('passes the address the code was sent to', async () => {
    const onVerified = vi.fn();
    renderWithRouter(<BuilderSignInForm resendNote="r" initialSentTo="owner@jamjam.tech" onVerified={onVerified} />);
    await userEvent.type(code(), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onVerified).toHaveBeenCalledWith('owner@jamjam.tech');
  });

  it('shows the sending state', () => {
    renderWithRouter(<BuilderSignInForm resendNote="r" phase="sending" onVerified={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
  });

  it('shows the expired link and a wrong code', () => {
    renderWithRouter(<BuilderSignInForm resendNote="r" phase="expired" initialSentTo="you@jamjam.tech" initialCodeError="That code is wrong." onVerified={vi.fn()} />);
    expect(screen.getAllByRole('alert').map((a) => a.textContent).join(' ')).toMatch(/expired or was already used.*That code is wrong/);
  });
});
