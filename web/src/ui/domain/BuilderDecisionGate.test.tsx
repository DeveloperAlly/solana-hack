import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderDecisionGate.example';

describe('BuilderDecisionGate', () => {
  it('Cancel clears the whole request-changes form, note and error', async () => {
    renderWithRouter(example.render());
    await userEvent.click(screen.getByRole('button', { name: 'Request changes' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    await userEvent.type(screen.getByLabelText('What should change?'), 'Half a thought');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Request changes' }));
    expect(screen.getByLabelText('What should change?')).toHaveValue('');
    expect(screen.getByLabelText('What should change?')).not.toHaveAttribute('aria-invalid');
  });

  it('requests changes with a required note, then approves with a recorded decision, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await expectNoAxeViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Request changes' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(screen.getByLabelText('What should change?')).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(screen.getByLabelText('What should change?'), 'Shorter, less abstract.');
    await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Changes requested');
    expect(screen.getByRole('alert')).toHaveTextContent('Shorter, less abstract.');
    await userEvent.type(screen.getByLabelText(/Why this wording/), 'It names the proof.');
    await userEvent.click(screen.getByRole('button', { name: 'Approve purpose' }));
    expect(screen.getByRole('heading', { name: 'Purpose approved' })).toBeInTheDocument();
    expect(screen.getByText(/\[owner email\].*Why: It names the proof\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/system');
    await expectNoAxeViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Reopen' }));
    expect(screen.getByRole('button', { name: 'Approve purpose' })).toBeInTheDocument();
  });
});
