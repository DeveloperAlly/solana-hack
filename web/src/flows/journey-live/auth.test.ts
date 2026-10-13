import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), signInAnonymously: vi.fn(), refreshSession: vi.fn(), updateUser: vi.fn(), signInWithOtp: vi.fn(), verifyOtp: vi.fn(), getUser: vi.fn(), api: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { auth: mocks } }));
vi.mock('../../lib/api', () => ({ api: mocks.api }));
import { ensureJourneySession, finishJourneySignIn, sendJourneyEmail } from './auth';
const anon = { access_token: 'anon-token', user: { id: 'anon', is_anonymous: true } };
beforeEach(() => {
  vi.resetAllMocks(); sessionStorage.clear();
  mocks.getSession.mockResolvedValue({ data: { session: anon }, error: null });
  mocks.refreshSession.mockResolvedValue({ data: { session: anon }, error: null });
  mocks.updateUser.mockResolvedValue({ data: {}, error: null });
  mocks.signInWithOtp.mockResolvedValue({ data: {}, error: null });
  mocks.verifyOtp.mockResolvedValue({ data: {}, error: null });
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'anon', is_anonymous: false } }, error: null });
  mocks.api.mockResolvedValue({ moved: ['brand'] });
});
describe('Journey auth handoff', () => {
  it('starts an anonymous session only when none exists', async () => {
    await expect(ensureJourneySession()).resolves.toEqual(anon);
    expect(mocks.signInAnonymously).not.toHaveBeenCalled();
    mocks.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    mocks.signInAnonymously.mockResolvedValue({ data: { session: anon }, error: null });
    await expect(ensureJourneySession()).resolves.toEqual(anon);
  });
  it('links a new email and verifies email_change without moving ownership', async () => {
    await sendJourneyEmail('new@example.com');
    await finishJourneySignIn('12345678');
    expect(mocks.updateUser).toHaveBeenCalledWith({ email: 'new@example.com' }, expect.any(Object));
    expect(mocks.verifyOtp).toHaveBeenCalledWith({ email: 'new@example.com', token: '12345678', type: 'email_change' });
    expect(mocks.api).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('jamjam.journey.authHandoff')).toBeNull();
  });
  it('claims to an existing account using the retained anonymous proof after verification', async () => {
    mocks.updateUser.mockResolvedValue({ error: { code: 'email_exists' } });
    await sendJourneyEmail('existing@example.com');
    await finishJourneySignIn('12345678');
    expect(mocks.signInWithOtp).toHaveBeenCalledWith(expect.objectContaining({ email: 'existing@example.com', options: expect.objectContaining({ shouldCreateUser: false }) }));
    expect(mocks.verifyOtp).toHaveBeenCalledWith(expect.objectContaining({ type: 'email' }));
    expect(mocks.api).toHaveBeenCalledWith('/me/claim', { body: { anonymousToken: 'anon-token' } });
  });
  it('does not disguise configuration or network linking failures as successful email delivery', async () => {
    const error = new Error('Manual linking disabled');
    mocks.updateUser.mockResolvedValue({ error });
    await expect(sendJourneyEmail('new@example.com')).rejects.toThrow('Manual linking disabled');
    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('jamjam.journey.authHandoff')).toBeNull();
  });
  it('completes a returned magic link once when the route and code action race', async () => {
    mocks.updateUser.mockResolvedValue({ error: { code: 'email_exists' } });
    await sendJourneyEmail('existing@example.com', 'brand');
    await Promise.all([finishJourneySignIn(), finishJourneySignIn()]);
    expect(mocks.api).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('jamjam.journey.authHandoff')).toBeNull();
  });
  it('retains the handoff for retry when the server claim fails', async () => {
    mocks.updateUser.mockResolvedValue({ error: { code: 'email_exists' } });
    await sendJourneyEmail('existing@example.com');
    mocks.api.mockRejectedValue(new Error('Claim failed'));
    await expect(finishJourneySignIn('12345678')).rejects.toThrow('Claim failed');
    expect(sessionStorage.getItem('jamjam.journey.authHandoff')).not.toBeNull();
  });
});
