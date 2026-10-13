import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderScreen } from './renderScreen';

const publish = () => screen.getByRole('region', { name: 'Publish' });
const checks = () => screen.getByRole('region', { name: 'Checks' });

describe('Draft-Review flow (n-dr, n-drb, n-dre)', () => {
  it('pre-selects no publish route: Approve waits for a real choice', async () => {
    renderScreen('Draft-Review');
    const approve = within(publish()).getByRole('button', { name: 'Approve' });
    expect(approve).toBeDisabled();
    expect(within(publish()).getAllByRole('radio').every((r) => !(r as HTMLInputElement).checked)).toBe(true);
    await userEvent.click(within(publish()).getByRole('radio', { name: /Schedule/ }));
    expect(approve).toBeEnabled();
  });

  it('approval is recorded first; registering on Solana is a separate, later step', async () => {
    renderScreen('Draft-Review');
    await userEvent.click(within(publish()).getByRole('radio', { name: /Copy, post it yourself/ }));
    await userEvent.click(within(publish()).getByRole('button', { name: 'Approve' }));
    expect(within(publish()).getByRole('heading', { name: 'Approved' })).toBeInTheDocument();
    expect(within(publish()).getByText(/Route: Copy, post it yourself/)).toBeInTheDocument();
    expect(within(publish()).queryByRole('link', { name: 'Check it on Verify' })).toBeNull();
    await userEvent.click(within(publish()).getByRole('button', { name: 'Register on Solana' }));
    expect(within(publish()).getByRole('heading', { name: 'Registered on Solana (devnet)' })).toBeInTheDocument();
    expect(within(publish()).getByRole('link', { name: 'Check it on Verify' })).toHaveAttribute('href', expect.stringMatching(/^\/screens\/Verify-1-Match\?q=%5BDraft%20post/));
  });

  it('the no-AI-slop pass and the claims gate run on edits and block approval', async () => {
    renderScreen('Draft-Review');
    await userEvent.click(within(publish()).getByRole('radio', { name: /Post to/ }));
    const post = screen.getByRole('textbox', { name: 'Post (editable)' });
    await userEvent.clear(post);
    await userEvent.type(post, 'A game-changer for agents.');
    expect(within(checks()).getByText(/Fails · remove "game-changer"/)).toBeInTheDocument();
    expect(within(publish()).getByRole('button', { name: 'Approve' })).toBeDisabled();
    await userEvent.clear(post);
    await userEvent.type(post, 'Agents get 10x faster.');
    expect(within(checks()).getByText('Passed after 2 fixes')).toBeInTheDocument();
    expect(within(checks()).getByText(/Blocked · unapproved: 10x/)).toBeInTheDocument();
    expect(within(publish()).getByText(/a number is not an approved claim/)).toBeInTheDocument();
    await userEvent.clear(post);
    await userEvent.type(post, 'Agents read the file at the start of each session.');
    expect(within(checks()).getByText('Pass · 0 unapproved claims')).toBeInTheDocument();
    expect(within(publish()).getByRole('button', { name: 'Approve' })).toBeEnabled();
  });

  it('Reject and Ask for a rewrite change the card, and Undo brings the draft back', async () => {
    renderScreen('Draft-Review');
    await userEvent.click(within(publish()).getByRole('button', { name: 'Reject' }));
    expect(within(publish()).getByRole('heading', { name: 'Rejected' })).toBeInTheDocument();
    await userEvent.click(within(publish()).getByRole('button', { name: 'Undo' }));
    await userEvent.click(within(publish()).getByRole('button', { name: 'Ask for a rewrite' }));
    expect(within(publish()).getByRole('heading', { name: 'Rewrite requested' })).toBeInTheDocument();
  });

  it('Beautify makes a version shown before and after; Undo Beautify goes back to the editor', async () => {
    renderScreen('Draft-Review');
    await userEvent.click(screen.getByRole('button', { name: 'Beautify' }));
    expect(screen.getByRole('heading', { name: 'Beautify applied' })).toBeInTheDocument();
    expect(screen.getByText('v3 · Beautify (accessible mode)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Undo Beautify' }));
    expect(screen.getByRole('textbox', { name: 'Post (editable)' })).toBeInTheDocument();
    expect(screen.queryByText('v3 · Beautify (accessible mode)')).toBeNull();
  });

  it('accessible mode changes the Beautify version it makes', async () => {
    renderScreen('Draft-Review');
    await userEvent.click(screen.getByRole('checkbox', { name: /Accessible mode/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Beautify' }));
    expect(screen.getByText('v3 · Beautify')).toBeInTheDocument();
  });

  it('opens on the Beautified artboard with v3 on top', () => {
    renderScreen('Draft-Review-Beautified');
    expect(screen.getByRole('heading', { name: 'Beautify applied' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo v3 · Beautify (accessible mode)' })).toBeInTheDocument();
  });

  it('a failed polish says what happened; Retry applies it and Dismiss clears it', async () => {
    renderScreen('Draft-Review-PolishError', 'error');
    expect(screen.getByRole('alert')).toHaveTextContent("Shorten didn't finish.");
    await userEvent.click(screen.getByRole('button', { name: 'Retry Shorten' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('v3 · Shorten')).toBeInTheDocument();
  });

  it('keeps approval disabled while the draft is being written', async () => {
    renderScreen('Draft-Review', 'loading');
    expect(screen.getByRole('status')).toHaveTextContent('Writing…');
    await userEvent.click(within(publish()).getByRole('radio', { name: /Post to/ }));
    expect(within(publish()).getByRole('button', { name: 'Approve' })).toBeDisabled();
  });
});
