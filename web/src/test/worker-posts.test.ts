import { afterEach, describe, expect, it, vi } from 'vitest';
import { casFilter, changePost, cleanPublishedUrl, contentHash, isPolishAction, polishPost, pushHistory, restoreEntry, slopCheck, undoPost, verifyText, type Post } from '../../worker/posts';
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
