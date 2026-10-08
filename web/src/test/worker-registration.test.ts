import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Env } from '../../worker/env';

// The Solana side is mocked; these tests pin the database state machine around it.
const reg = vi.hoisted(() => ({ send: vi.fn(), onchain: 'verified' as string }));
vi.mock('../../worker/registry', () => {
  class NotLanded extends Error {}
  return {
    NotLanded,
    explorerTx: (s: string) => `https://explorer/${s}`,
    registrarFromSecret: async () => ({ address: 'REGISTRAR' }),
    prepareKitAttestation: async () => ({ signature: 'SIG', attestation: 'ATT', explorer: 'https://explorer/SIG', send: reg.send }),
    readKitAttestation: async () => reg.onchain,
  };
});
const { registerPost, reconcilePost, verifyText, cleanPublishedUrl } = await import('../../worker/posts');
const { NotLanded } = await import('../../worker/registry');

const env = { SUPABASE_URL: 'https://db.test', SUPABASE_SECRET_KEY: 'k', REGISTRAR_KEY: '[1]', RPC_URL: 'https://rpc.test' } as Env;
const user = { id: 'u' } as never;
let writes: { url: string; body: Record<string, unknown> }[] = [];
let selectRows: unknown[] = [];
beforeEach(() => {
  writes = [];
  reg.send.mockReset();
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    if (init?.method === 'PATCH') {
      const body = JSON.parse(String(init.body));
      writes.push({ url, body });
      return new Response(JSON.stringify([{ id: 'p', status: body.status ?? 'registering', body: 'Text.' }]));
    }
    if (url.includes('/brands?')) return new Response(JSON.stringify([{ id: 'b', name: 'Brand' }]));
    return new Response(JSON.stringify(selectRows));
  }));
});
afterEach(() => vi.unstubAllGlobals());

const approved = { id: 'p', rev: 2, brand_id: 'b', status: 'approved', body: 'Text.', kit_version: 1, approved_by: 'u', checks: { policy: { passed: true } } } as never;

describe('post registration', () => {
  it('refuses a post approved before the claims and content checks existed', async () => {
    const legacy = { ...(approved as object), checks: {} } as never;
    await expect(registerPost(env, user, legacy, '')).rejects.toMatchObject({ status: 409, message: expect.stringContaining('Run approval checks') });
    expect(reg.send).not.toHaveBeenCalled();
    expect(writes).toHaveLength(0);
  });
  it('records signature and attestation in the claim, before sending', async () => {
    reg.send.mockImplementation(async () => { expect(writes[0].body).toMatchObject({ status: 'registering', signature: 'SIG', attestation: 'ATT', rev: 3 }); });
    const r = await registerPost(env, user, approved, '');
    expect(writes[0].url).toContain('rev=eq.2');
    expect(writes[1].body).toMatchObject({ status: 'registered' });
    expect(r.explorer).toBe('https://explorer/SIG');
  });
  it('reopens the post only when the send certainly did not land', async () => {
    reg.send.mockRejectedValue(new NotLanded('rejected'));
    await expect(registerPost(env, user, approved, '')).rejects.toMatchObject({ status: 502 });
    expect(writes[1].body).toMatchObject({ status: 'approved', signature: null });
  });
  it('keeps an unknown outcome locked instead of making it retryable', async () => {
    reg.send.mockRejectedValue(new Error('confirm timeout'));
    await expect(registerPost(env, user, approved, '')).rejects.toMatchObject({ status: 502, message: expect.stringContaining('stays locked') });
    expect(writes).toHaveLength(1);
  });
  it('reconciles a locked post: finished when the attestation is on chain', async () => {
    reg.onchain = 'verified';
    const locked = { ...(approved as object), status: 'registering', hash: 'sha256:x', signature: 'SIG', attestation: 'ATT', registering_at: new Date().toISOString() } as never;
    await reconcilePost(env, locked);
    expect(writes[0].body).toMatchObject({ status: 'registered' });
    expect(reg.send).not.toHaveBeenCalled();
  });
  it('reconciles a locked post: reopened only once its blockhash must have expired', async () => {
    reg.onchain = 'missing';
    const recent = { ...(approved as object), status: 'registering', hash: 'h', signature: 'SIG', attestation: 'ATT', registering_at: new Date().toISOString() } as never;
    await expect(reconcilePost(env, recent)).rejects.toMatchObject({ status: 409, message: expect.stringContaining('settling') });
    expect(writes).toHaveLength(0);
    const old = { ...(recent as object), registering_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() } as never;
    await expect(reconcilePost(env, old)).rejects.toMatchObject({ status: 409 });
    expect(writes[0].body).toMatchObject({ status: 'approved' });
  });
});

describe('verify checks Solana, not just the index', () => {
  const row = { brand_id: 'b', kit_version: 1, approved_at: 'a', registered_at: 'r', published_url: null, signature: 'SIG', attestation: 'ATT' };
  it('is official when the attestation verifies, and says the domain is not verified', async () => {
    selectRows = [row]; reg.onchain = 'verified';
    expect(await verifyText(env, 'Text.')).toMatchObject({ official: true, checked: true, brand: 'Brand', domainVerified: false, truncated: false });
  });
  it('returns every brand that registered the same text, earliest first', async () => {
    selectRows = [row, { ...row, brand_id: 'b2', kit_version: 2 }]; reg.onchain = 'verified';
    vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(url.includes('/brands?') ? [{ id: 'b', name: 'First' }, { id: 'b2', name: 'Second' }] : selectRows))));
    const r = await verifyText(env, 'Same words.');
    expect(r.matches.map((m) => m.brand)).toEqual(['First', 'Second']);
    expect(r).toMatchObject({ brand: 'First', kitVersion: 1 });
  });
  it('never certifies from the index when Solana cannot be checked', async () => {
    selectRows = [row]; reg.onchain = 'unavailable';
    expect(await verifyText(env, 'Text.')).toMatchObject({ official: false, checked: false, note: expect.stringContaining('could not be checked') });
  });
  it('checks at most 10 registrations and reports truncation', async () => {
    selectRows = Array.from({ length: 11 }, () => row); reg.onchain = 'verified';
    const r = await verifyText(env, 'Text.');
    expect(r.matches).toHaveLength(10);
    expect(r).toMatchObject({ truncated: true });
  });
  it('is not official when the attestation is missing or does not match', async () => {
    selectRows = [row]; reg.onchain = 'mismatch';
    expect(await verifyText(env, 'Text.')).toMatchObject({ official: false, note: expect.stringContaining('attestation') });
  });
});

describe('published links', () => {
  it('rejects links with embedded credentials', () => {
    expect(() => cleanPublishedUrl('https://user:pass@example.com/post')).toThrow();
    expect(() => cleanPublishedUrl('https://user@example.com/post')).toThrow();
  });
});
