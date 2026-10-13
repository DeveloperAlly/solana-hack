import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { proofTransition } from '../../domain/rating';
import { EventProofStep } from './EventProofStep';
import { example } from './EventProofStep.example';

const noop = () => undefined;

describe('D102 EventProofStep', () => {
  it('renders every state with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await expectNoAxeViolations(container);
  });

  it('validates the email before checking the guest list', async () => {
    const onEmail = vi.fn();
    renderWithRouter(<EventProofStep proof={{ status: 'not-proven' }} onLuma={noop} onEmail={onEmail} onReset={noop} />);
    await userEvent.click(screen.getByRole('button', { name: 'Check the guest list' }));
    expect(screen.getByText(/Enter the email you registered with/)).toBeInTheDocument();
    expect(onEmail).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText('Guest-list email'), 'a@b.co');
    await userEvent.click(screen.getByRole('button', { name: 'Check the guest list' }));
    expect(onEmail).toHaveBeenCalledWith('a@b.co');
  });

  it('disables both ways while proving', () => {
    renderWithRouter(<EventProofStep proof={{ status: 'proving', kind: 'luma-checkin' }} onLuma={noop} onEmail={noop} onReset={noop} />);
    expect(screen.getByRole('button', { name: 'Prove I went with Luma' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Check the guest list' })).toBeDisabled();
  });

  it('the state machine allows only legal moves', () => {
    const start = { status: 'not-proven' } as const;
    expect(proofTransition(start, { type: 'succeed' })).toEqual(start);
    const proving = proofTransition(start, { type: 'start', kind: 'luma-checkin' });
    expect(proving.status).toBe('proving');
    expect(proofTransition(proving, { type: 'reset' })).toBe(proving);
    const failed = proofTransition(proving, { type: 'fail', reason: 'no' });
    expect(failed.status).toBe('failed');
    expect(proofTransition(failed, { type: 'start', kind: 'guest-list-email' }).status).toBe('proving');
    const proven = proofTransition(proofTransition(start, { type: 'start', kind: 'luma-checkin' }), { type: 'succeed' });
    expect(proofTransition(proven, { type: 'start', kind: 'guest-list-email' })).toBe(proven);
  });
});
