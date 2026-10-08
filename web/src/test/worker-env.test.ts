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
