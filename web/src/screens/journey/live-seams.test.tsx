import { beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { SaveSignIn } from './SaveSignIn';
import { JourneyFlowContext, initialSelections, type JourneyActions } from './useJourneyFlow';
import { JourneyHrefContext } from './paths';
import { JourneyNextButton } from './JourneyNextButton';
beforeEach(cleanup);
const pending = () => { let resolve!: () => void; const promise = new Promise<void>(r => { resolve = r; }); return { promise, resolve }; };
it('awaits actual OTP verification before navigating and displays failure', async () => {
  const request = pending(); const verifyCode = vi.fn(() => request.promise);
  render(<MemoryRouter initialEntries={['/save']}><JourneyHrefContext.Provider value={t => `/${t}`}><JourneyFlowContext.Provider value={{ selections: { ...initialSelections, signIn: 'code', emailSentTo: 'me@example.com' }, actions: { verifyCode } as unknown as JourneyActions }}><Routes><Route path="/save" element={<SaveSignIn sending={false} />} /><Route path="/confirm" element={<div>Confirmed route</div>} /></Routes></JourneyFlowContext.Provider></JourneyHrefContext.Provider></MemoryRouter>);
  await userEvent.type(screen.getByLabelText('Code from the email'), '12345678');
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(verifyCode).toHaveBeenCalledWith('12345678');
  expect(screen.queryByText('Confirmed route')).not.toBeInTheDocument();
  request.resolve(); await screen.findByText('Confirmed route');
});
it('retains the current screen when a live next action rejects', async () => {
  render(<MemoryRouter initialEntries={['/post']}><Routes><Route path="/post" element={<JourneyNextButton href="/proof" ready hint="" onGo={async () => { throw new Error('Registration refused'); }}>Register</JourneyNextButton>} /><Route path="/proof" element={<div>Proof route</div>} /></Routes></MemoryRouter>);
  await userEvent.click(screen.getByRole('button', { name: 'Register' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Registration refused'));
  expect(screen.queryByText('Proof route')).not.toBeInTheDocument();
});
