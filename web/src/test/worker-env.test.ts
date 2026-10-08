import { describe, expect, it } from 'vitest';
import { rpcHostLabel, safeError } from '../../worker/env';

describe('Worker log redaction', () => {
  it('strips RPC credentials from logged errors', () => {
    const e = Object.assign(new Error('HTTP error (403): fetch https://devnet.helius-rpc.com/?api-key=abcd-1234-secret failed token=xyz'), { context: { statusCode: 403, __code: 8100002 } });
    const s = safeError(e);
    expect(s.message).not.toContain('abcd-1234-secret');
    expect(s.message).not.toContain('xyz');
    expect(s.message).toContain('https://devnet.helius-rpc.com/');
    expect(s).toMatchObject({ name: 'Error', status: 403, solanaErrorCode: 8100002 });
  });
  it('drops URL paths and unknown hosts, where keys can also live', () => {
    const s = safeError(new Error('fetch https://solana-devnet.g.alchemy.com/v2/shortKey_9 and https://tenant-k3y.example.com/rpc failed'));
    expect(s.message).not.toContain('shortKey_9');
    expect(s.message).not.toContain('tenant-k3y');
    expect(s.message).toContain('[url]');
  });
  it('reports the RPC host only for known providers', () => {
    expect(rpcHostLabel('https://devnet.helius-rpc.com/?api-key=k')).toBe('devnet.helius-rpc.com');
    expect(rpcHostLabel('https://api.devnet.solana.com')).toBe('api.devnet.solana.com');
    expect(rpcHostLabel('https://tenant-secret.example.com/rpc')).toBe('custom');
    expect(rpcHostLabel('nope')).toBe('invalid URL');
  });
});

describe('database error logging', () => {
  it('logs the table, method, status and code only, never filters or the body', async () => {
    const { db } = await import('../../worker/db');
    const { vi } = await import('vitest');
    const logged: unknown[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => { logged.push(a); });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ code: '23505', message: 'duplicate', details: 'Key (email)=(a@b.c) exists' }), { status: 409 })));
    await expect(db.select({ SUPABASE_URL: 'https://db.test', SUPABASE_SECRET_KEY: 'k' } as never, 'brands', 'owner_id=eq.user-123')).rejects.toMatchObject({ status: 500 });
    const out = JSON.stringify(logged);
    expect(out).toContain('"table":"brands"');
    expect(out).toContain('23505');
    expect(out).not.toContain('user-123');
    expect(out).not.toContain('a@b.c');
    spy.mockRestore();
    vi.unstubAllGlobals();
  });
});

describe('LLM error logging', () => {
  it('logs the status and provider code, never the provider message', async () => {
    const { chat } = await import('../../worker/llm');
    const { vi } = await import('vitest');
    const logged: unknown[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...a) => { logged.push(a); });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { code: 400, message: 'Bad input: my secret founder story' } }), { status: 400 })));
    await expect(chat({ OPENROUTER_API_KEY: 'k' } as never, 's', 'u')).rejects.toMatchObject({ status: 502 });
    const out = JSON.stringify(logged);
    expect(out).toContain('"status":400');
    expect(out).not.toContain('founder story');
    spy.mockRestore();
    vi.unstubAllGlobals();
  });
});

describe('public endpoint limit', () => {
  it('keys on endpoint and client IP and answers 429 when the limit is hit', async () => {
    const { publicLimit } = await import('../../worker/api');
    const keys: string[] = [];
    const env = { PUBLIC_LIMITER: { limit: async ({ key }: { key: string }) => { keys.push(key); return { success: keys.length < 2 }; } } } as never;
    const req = new Request('https://x/api/verify', { headers: { 'cf-connecting-ip': '203.0.113.9' } });
    await publicLimit(req, env, 'verify');
    await expect(publicLimit(req, env, 'verify')).rejects.toMatchObject({ status: 429 });
    expect(keys).toEqual(['verify:203.0.113.9', 'verify:203.0.113.9']);
  });
});

describe('registrar key errors', () => {
  it('never carry any part of a malformed key', async () => {
    const { registrarFromSecret } = await import('../../worker/registry');
    for (const bad of ['[12,34,56', '[1,2,3]', 'not json 9f8e7d', JSON.stringify(Array(64).fill(999))]) {
      const err = await registrarFromSecret(bad).then(() => null, (e: Error) => e);
      expect(err?.name).toBe('RegistrarKeyError');
      expect(err?.message).toBe('REGISTRAR_KEY is not a valid 64-byte keypair array');
      expect(JSON.stringify(safeError(err))).not.toMatch(/12,34|9f8e7d|999/);
    }
  });
});
