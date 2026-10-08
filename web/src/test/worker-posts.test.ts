import { afterEach, describe, expect, it, vi } from 'vitest';
import { casFilter, changePost, cleanPublishedUrl, contentHash, approvePost, isPolishAction, policyVerdict, polishPost, pushHistory, restoreEntry, slopCheck, undoPost, verifyText, type Post } from '../../worker/posts';
import type { Env } from '../../worker/env';

const env = { SUPABASE_URL: 'https://db.test', SUPABASE_SECRET_KEY: 'k' } as Env;
afterEach(() => vi.unstubAllGlobals());

describe('post checks', () => {
  it('flags banned phrases, em dashes and exclamation marks', () => {
    expect(slopCheck('We help brands prove what they said.').passed).toBe(true);
    const r = slopCheck('Unlock a seamless future — now!');
    expect(r.passed).toBe(false);
    expect(r.hits).toEqual(expect.arrayContaining(['unlock', 'seamless', '—', 'exclamation mark']));
  });
  it('hashes whitespace variants the same and an edited word differently', async () => {
    const a = await contentHash('We built Waterlily.\n\nIt proves  what brands said.');
    expect(await contentHash('  We built Waterlily.\r\n\r\n\r\nIt proves what brands said. ')).toBe(a);
    expect(await contentHash('We built Waterlily.\n\nIt proves what brands say.')).not.toBe(a);
  });
  it('accepts only http(s) published links', () => {
    expect(cleanPublishedUrl('')).toBeNull();
    expect(cleanPublishedUrl('https://www.linkedin.com/posts/x')).toBe('https://www.linkedin.com/posts/x');
    expect(() => cleanPublishedUrl('javascript:alert(1)')).toThrow();
    expect(() => cleanPublishedUrl('not a url')).toThrow();
  });
});

describe('post concurrency and verify', () => {
  it('changes a post only at the revision and states it was read in', () => {
    expect(casFilter({ id: 'p1', rev: 3 }, ['drafted', 'approved'])).toBe('id=eq.p1&rev=eq.3&status=in.(drafted,approved)');
  });
  it('rejects a stale change with 409 instead of overwriting', async () => {
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => { calls.push(`${init.method} ${url} ${init.body}`); return new Response('[]'); }));
    await expect(changePost(env, { id: 'p1', rev: 2 } as Post, ['drafted'], { status: 'approved' })).rejects.toMatchObject({ status: 409 });
    expect(calls[0]).toContain('rev=eq.2');
    expect(calls[0]).toContain('"rev":3');
  });
  it('returns every brand that registered the same text, earliest first', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/posts?')) return new Response(JSON.stringify([
        { brand_id: 'b1', kit_version: 1, approved_at: '2026-10-01T00:00:00Z', published_url: null, signature: 'sig1' },
        { brand_id: 'b2', kit_version: 2, approved_at: '2026-10-02T00:00:00Z', published_url: null, signature: null },
      ]));
      return new Response(JSON.stringify([{ id: 'b1', name: 'First' }, { id: 'b2', name: 'Second' }]));
    }));
    const r = await verifyText(env, 'Same words.');
    expect(r.official).toBe(true);
    expect(r.matches.map((m) => m.brand)).toEqual(['First', 'Second']);
    expect(r).toMatchObject({ brand: 'First', kitVersion: 1 });
  });
});

describe('polish safety', () => {
  it('accepts only declared polish actions, never inherited keys', () => {
    expect(isPolishAction('shorten')).toBe(true);
    expect(isPolishAction('beautify_accessible')).toBe(true);
    for (const bad of ['constructor', 'toString', '__proto__', 'hasOwnProperty', '', 42]) expect(isPolishAction(bad)).toBe(false);
  });
  it('rejects an unknown action before calling the model', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    await expect(polishPost(env, { status: 'drafted' } as Post, 'constructor')).rejects.toMatchObject({ status: 400 });
    expect(f).not.toHaveBeenCalled();
  });
  it('keeps the scores and notes with each history entry, so Undo restores them', () => {
    const post = { body: 'Old text.', checks: { slop: { passed: true, hits: [] }, voiceFit: 81, platform: 70, notes: ['Add a number.'], source: 'ai' } } as unknown as Post;
    const [entry] = pushHistory(post);
    expect(restoreEntry(entry)).toMatchObject({ body: 'Old text.', voiceFit: 81, platform: 70, notes: ['Add a number.'] });
  });
  it('restores legacy text-only history with cleared scores', () => {
    expect(restoreEntry('Legacy text.')).toMatchObject({ body: 'Legacy text.', voiceFit: null, platform: null, notes: [], slop: { passed: true } });
  });
  it('undo writes only the revision it read and restores the prior notes', async () => {
    const calls: { url: string; body: Record<string, unknown> }[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => { calls.push({ url, body: JSON.parse(String(init.body)) }); return new Response(JSON.stringify([{ id: 'p' }])); }));
    const post = { id: 'p', rev: 4, status: 'drafted', body: 'New.', checks: { slop: { passed: true, hits: [] }, voiceFit: 50, platform: 50, notes: ['later note'],
      history: [{ body: 'Before.', slop: { passed: true, hits: [] }, voiceFit: 90, platform: 80, notes: ['earlier note'] }] } } as unknown as Post;
    await undoPost(env, post);
    expect(calls[0].url).toContain('rev=eq.4');
    expect(calls[0].body).toMatchObject({ body: 'Before.', rev: 5, checks: { voiceFit: 90, notes: ['earlier note'], history: [] } });
  });
});

describe('approval gates: claims and content policy', () => {
  const clean = { unsupported: [], sexual: false, minors: false, explicitLanguage: false };
  it('passes only with no unsupported claims and no blocked category', () => {
    expect(policyVerdict('4', 'friendly', clean).passed).toBe(true);
    expect(policyVerdict('5', null, { ...clean, unsupported: ['2x faster'] })).toMatchObject({ passed: false, unsupported: ['2x faster'] });
    expect(policyVerdict('4', 'friendly', { ...clean, sexual: true })).toMatchObject({ passed: false, blocked: ['sexual content'] });
    expect(policyVerdict('4', 'playful', { ...clean, minors: true }).passed).toBe(false);
  });
  it('blocks explicit language for Flirty only', () => {
    expect(policyVerdict('4', 'flirty', { ...clean, explicitLanguage: true })).toMatchObject({ passed: false, blocked: ['explicit language'] });
    expect(policyVerdict('4', 'candid_founder', { ...clean, explicitLanguage: true }).passed).toBe(true);
  });
  it('fails closed on a malformed classifier reply', () => {
    for (const bad of [{}, null, { unsupported: 'none', sexual: false, minors: false, explicitLanguage: false }, { unsupported: [], sexual: 'no', minors: false, explicitLanguage: false }, { unsupported: [1], sexual: false, minors: false, explicitLanguage: false }, { unsupported: [], sexual: false, minors: false }]) {
      expect(() => policyVerdict('4', null, bad)).toThrow(/unusable/);
    }
  });

  function stub(reply: unknown, voice: Record<string, string>, kitPolicy?: Record<string, string>) {
    const writes: Record<string, unknown>[] = [];
    let system = '';
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      if (url.startsWith('https://openrouter.ai')) {
        system = JSON.parse(String(init.body)).messages[0].content;
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) } }] }));
      }
      if (url.includes('/kits?')) return new Response(JSON.stringify(kitPolicy ? [{ payload: { policy: kitPolicy } }] : []));
      if (url.includes('/answers?')) return new Response(JSON.stringify([{ data: voice }]));
      if (url.includes('/evidence?')) return new Response(JSON.stringify([{ claim: 'Founded in 2024', origin: 'source' }]));
      if (init.method === 'PATCH') { writes.push(JSON.parse(String(init.body))); return new Response(JSON.stringify([{ id: 'p' }])); }
      return new Response('[]');
    }));
    return { writes, system: () => system };
  }
  const llmEnv = { ...env, OPENROUTER_API_KEY: 'k' } as Env;
  const post = { id: 'p', rev: 1, brand_id: 'b', kit_version: 1, status: 'drafted', body: 'We are 2x faster.', checks: { slop: { passed: true, hits: [] }, voiceFit: 80, platform: 80, notes: [] } } as unknown as Post;
  const user = { id: 'u' } as never;

  it('blocks approval when the claims gate finds an unsupported claim, and records why', async () => {
    const s = stub({ ...clean, unsupported: ['2x faster'] }, { template: 'professional', claims: '5' });
    await expect(approvePost(llmEnv, user, post)).rejects.toMatchObject({ status: 409, message: expect.stringContaining('claims gate (strict)') });
    expect(s.system()).toContain('strict: every claim');
    expect(s.writes[0]).toMatchObject({ rev: 2, checks: { policy: { passed: false, unsupported: ['2x faster'] } } });
    expect(s.writes[0]).not.toHaveProperty('status');
  });
  it('uses the registered kit policy over a later voice answer', async () => {
    const s = stub({ ...clean, unsupported: ['2x faster'] }, { template: 'friendly', claims: '3' }, { claims: '5', template: 'professional' });
    await expect(approvePost(llmEnv, user, post)).rejects.toMatchObject({ message: expect.stringContaining('strict') });
    expect(s.system()).toContain('strict: every claim');
  });
  it('blocks prohibited content and tells the checker when the voice is flirty', async () => {
    const s = stub({ ...clean, sexual: true }, { template: 'flirty', claims: '4' });
    await expect(approvePost(llmEnv, user, post)).rejects.toMatchObject({ status: 409, message: expect.stringContaining('content policy (sexual content)') });
    expect(s.system()).toContain('flirty voice');
  });
  it('approves when both checks pass', async () => {
    const s = stub(clean, { template: 'friendly', claims: '3' });
    await approvePost(llmEnv, user, post);
    expect(s.writes[0]).toMatchObject({ status: 'approved', approved_by: 'u', checks: { policy: { passed: true, claims: '3' } } });
  });
  it('fails closed when the check cannot run or answers badly', async () => {
    const s = stub(clean, { template: 'friendly', claims: '4' });
    await expect(approvePost({ ...env } as Env, user, post)).rejects.toMatchObject({ status: 503 });
    stub({ unsupported: [] }, { template: 'friendly', claims: '4' });
    await expect(approvePost(llmEnv, user, post)).rejects.toMatchObject({ status: 502 });
    expect(s.writes).toHaveLength(0);
  });
});

describe('accessible beautify', () => {
  it('maps styled Unicode letters back to plain text', async () => {
    const { plainLetters } = await import('../../worker/posts');
    expect(plainLetters('𝗕𝘂𝗶𝗹𝘁 𝗳𝗼𝗿 𝟮𝟬𝟮𝟲 and 𝑖𝑡𝑎𝑙𝑖𝑐 • kept')).toBe('Built for 2026 and italic • kept');
  });
});

describe('polish grounding', () => {
  it('sends the cited evidence to the model and saves accessible output as plain letters', async () => {
    let prompt = '';
    let saved: Record<string, unknown> = {};
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      if (url.startsWith('https://openrouter.ai')) {
        prompt = JSON.parse(String(init.body)).messages[1].content;
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ body: '𝗪𝗲 𝘀𝗵𝗶𝗽 weekly.', voiceFit: 80, platform: 70, notes: [] }) } }] }));
      }
      if (url.includes('/kits?')) return new Response(JSON.stringify([{ version: 1, payload: { sections: [{ section: 'voice', body: 'Plain.', citations: ['11111111-1111-1111-1111-111111111111'] }] } }]));
      if (url.includes('/evidence?')) return new Response(JSON.stringify([{ claim: 'Ships weekly', quote: 'we ship every week' }]));
      if (init?.method === 'PATCH') { saved = JSON.parse(String(init.body)); return new Response(JSON.stringify([{ id: 'p' }])); }
      return new Response('[]');
    }));
    const post = { id: 'p', rev: 0, brand_id: 'b', kit_version: 1, status: 'drafted', body: 'We ship weekly.', channel: 'LinkedIn', checks: { slop: { passed: true, hits: [] }, voiceFit: null, platform: null, notes: [] } } as unknown as Post;
    await polishPost({ ...env, OPENROUTER_API_KEY: 'k' } as Env, post, 'beautify_accessible');
    expect(prompt).toContain('Ships weekly');
    expect(saved.body).toBe('We ship weekly.');
  });
});
