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
  it('collapses every whitespace run, line breaks included', async () => {
    expect(await contentHash('first line\nsecond line\n\nthird')).toBe(await contentHash('first line second line third'));
  });
  it('hashes canonically equivalent Unicode the same (NFC)', async () => {
    expect(await contentHash('Caf\u0065\u0301 launch.')).toBe(await contentHash('Caf\u00e9 launch.'));
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
  it('without a Registrar to check Solana, verify never certifies', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([{ brand_id: 'b1', kit_version: 1, attestation: 'A', signature: 's' }]))));
    expect(await verifyText(env, 'Same words.')).toMatchObject({ official: false, checked: false });
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
    expect(s.writes[0]).toMatchObject({ status: 'drafted', approved_by: null });
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
  it('re-checks a post approved before the checks existed, and reopens it if it fails', async () => {
    const s = stub({ ...clean, minors: true }, { template: 'friendly', claims: '4' });
    const legacy = { ...(post as object), status: 'approved', checks: { ...post.checks } } as unknown as Post;
    await expect(approvePost(llmEnv, user, legacy)).rejects.toMatchObject({ status: 409 });
    expect(s.writes[0]).toMatchObject({ status: 'drafted', checks: { policy: { passed: false } } });
  });
  it('pages through all evidence for the claims check', async () => {
    const { allEvidence } = await import('../../worker/posts');
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      urls.push(url);
      const offset = Number(new URL(url).searchParams.get('offset'));
      return new Response(JSON.stringify(Array.from({ length: offset < 2400 ? 200 : 13 }, (_, i) => ({ claim: `f${offset + i}` }))));
    }));
    const all = await allEvidence(env, 'b');
    expect(all).toHaveLength(2413);
    expect(urls[0]).toContain('origin=neq.assumption');
    expect(urls[0]).toContain('order=created_at.asc,id.asc');
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
    expect(plainLetters('Ｗｅ ⓢⓗⓘⓟ ① ℍ𝕖𝕪 🄰 🇦🇺')).toBe('We ship 1 Hey A 🇦🇺');
    expect(plainLetters('98℉, 10Ω, Brand™, ⑩ items, ＃1')).toBe('98℉, 10Ω, Brand™, ⑩ items, #1');
    expect(plainLetters('ᴴᵉˡˡᵒ ʰᵉˡˡᵒ but x² and note¹ stay')).toBe('Hello hello but x² and note¹ stay');
    expect(plainLetters('10¹² and 10⁻¹² and C₁₂H₂₂O₁₁ stay')).toBe('10¹² and 10⁻¹² and C₁₂H₂₂O₁₁ stay');
    expect(plainLetters('ʜᴇʟʟᴏ ᴡᴏʀʟᴅ')).toBe('hello world');
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

describe('polish uses the kit evidence snapshot', () => {
  it('reads cited evidence from the registered kit, even after the live rows were replaced', async () => {
    let prompt = '';
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      urls.push(url);
      if (url.startsWith('https://openrouter.ai')) {
        prompt = JSON.parse(String(init.body)).messages[1].content;
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ body: 'x', voiceFit: 1, platform: 1, notes: [] }) } }] }));
      }
      if (url.includes('/kits?')) return new Response(JSON.stringify([{ version: 1, payload: { sections: [{ section: 'voice', body: 'v', citations: ['11111111-1111-1111-1111-111111111111'] }], evidence: [{ claim: 'Snapshot fact', quote: null }] } }]));
      if (init?.method === 'PATCH') return new Response(JSON.stringify([{ id: 'p' }]));
      return new Response('[]');
    }));
    const post = { id: 'p', rev: 0, brand_id: 'b', kit_version: 1, status: 'drafted', body: 'b', channel: null, checks: { slop: { passed: true, hits: [] }, voiceFit: null, platform: null, notes: [] } } as unknown as Post;
    await polishPost({ ...env, OPENROUTER_API_KEY: 'k' } as Env, post, 'review');
    expect(prompt).toContain('Snapshot fact');
    expect(urls.some((u) => u.includes('/evidence?'))).toBe(false);
  });
});

describe('claims check over large evidence', () => {
  it('splits evidence into bounded batches', async () => {
    const { evidenceBatches } = await import('../../worker/posts');
    const b = evidenceBatches(Array.from({ length: 300 }, (_, i) => `- fact ${i} ${'x'.repeat(200)}`));
    expect(b.length).toBeGreaterThan(1);
    expect(b.every((x) => x.length <= 24000)).toBe(true);
    expect(b.join('\n').split('\n')).toHaveLength(300);
  });
  it('only re-checks still-unsupported claims against later batches', async () => {
    const { policyCheck } = await import('../../worker/posts');
    const prompts: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      if (url.startsWith('https://openrouter.ai')) {
        const user = JSON.parse(String(init.body)).messages[1].content as string;
        prompts.push(user);
        const reply = prompts.length === 1 ? { unsupported: ['Founded 2019', 'Used by 40 teams'], sexual: false, minors: false, explicitLanguage: false } : { supported: ['Used by 40 teams'] };
        return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(reply) } }] }));
      }
      if (url.includes('/evidence?')) {
        const offset = Number(new URL(url).searchParams.get('offset'));
        return new Response(JSON.stringify(offset === 0 ? Array.from({ length: 200 }, (_, i) => ({ claim: `fact ${i} ${'y'.repeat(200)}` })) : []));
      }
      if (url.includes('/answers?')) return new Response(JSON.stringify([{ data: { claims: '4', template: 'friendly' } }]));
      return new Response('[]');
    }));
    const r = await policyCheck({ ...env, OPENROUTER_API_KEY: 'k' } as Env, { brand_id: 'b', kit_version: null, body: 'p' } as unknown as Post);
    expect(prompts.length).toBeGreaterThan(1);
    expect(prompts[1]).toContain('- Founded 2019');
    expect(r).toMatchObject({ unsupported: ['Founded 2019'], passed: false });
  });
  it('keeps every unsupported claim, so a later batch cannot clear a dropped one', () => {
    const many = Array.from({ length: 8 }, (_, i) => `claim ${i}`);
    expect(policyVerdict('4', null, { unsupported: many, sexual: false, minors: false, explicitLanguage: false }).unsupported).toHaveLength(8);
  });
  it('treats only the current result shape as passing', async () => {
    const { isCurrentPolicy } = await import('../../worker/posts');
    expect(isCurrentPolicy({ claims: '4', template: null, unsupported: [], blocked: [], passed: true })).toBe(true);
    expect(isCurrentPolicy({ claims: '4', unsupported: [], explicit: false, passed: true })).toBe(false);
    expect(isCurrentPolicy(undefined)).toBe(false);
  });
});

describe('shorten respects the platform limit', () => {
  it('knows X is 280 and other channels have no hard limit', async () => {
    const { platformLimit } = await import('../../worker/posts');
    expect(platformLimit('X')).toBe(280);
    expect(platformLimit('twitter')).toBe(280);
    expect(platformLimit('LinkedIn')).toBeNull();
  });
  it('counts length the way X does', async () => {
    const { xWeightedLength } = await import('../../worker/posts');
    expect(xWeightedLength('hello')).toBe(5);
    expect(xWeightedLength('你好')).toBe(4);
    expect(xWeightedLength('see https://example.com/a/very/long/path/that/is/longer/than/twenty/three')).toBe(4 + 23);
    expect(xWeightedLength('ok 👍🏽')).toBe(3 + 2);
    expect(xWeightedLength('🇦🇺')).toBe(2);
    expect(xWeightedLength('1️⃣')).toBe(2);
    expect(xWeightedLength('字'.repeat(150))).toBe(300);
    expect(xWeightedLength('x '.repeat(128) + 'http://t.co/x:')).toBe(256 + 23 + 1);
  });
  it('refuses to save a Shorten result that is still over the X limit', async () => {
    let patched = false;
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      if (url.startsWith('https://openrouter.ai')) return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ body: 'w '.repeat(200), voiceFit: 1, platform: 1, notes: [] }) } }] }));
      if (url.includes('/kits?')) return new Response(JSON.stringify([{ version: 1, payload: { sections: [], evidence: [] } }]));
      if (init?.method === 'PATCH') { patched = true; return new Response('[]'); }
      return new Response('[]');
    }));
    const post = { id: 'p', rev: 0, brand_id: 'b', kit_version: 1, status: 'drafted', body: 'long', channel: 'X', checks: { slop: { passed: true, hits: [] }, voiceFit: null, platform: null, notes: [] } } as unknown as Post;
    await expect(polishPost({ ...env, OPENROUTER_API_KEY: 'k' } as Env, post, 'shorten')).rejects.toMatchObject({ status: 422 });
    expect(patched).toBe(false);
  });
});

describe('model replies', () => {
  it('turns wrong field types into empty values instead of crashing', async () => {
    const { modelPost } = await import('../../worker/posts');
    expect(modelPost({ body: {}, notes: 'x' })).toMatchObject({ body: '', notes: [] });
    expect(modelPost(null)).toMatchObject({ body: '', notes: [] });
    expect(modelPost({ body: 'ok', notes: ['a', 3] })).toMatchObject({ body: 'ok', notes: ['a'] });
  });
});

describe('claims gate uses the kit snapshot, with bounded cost', () => {
  function stubKit(evidence: { claim: string; origin?: string }[]) {
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      urls.push(url);
      if (url.startsWith('https://openrouter.ai')) return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ unsupported: [], sexual: false, minors: false, explicitLanguage: false }) } }] }));
      if (url.includes('/kits?')) return new Response(JSON.stringify([{ payload: { policy: { claims: '4', template: 'friendly' }, evidence } }]));
      return new Response('[]');
    }));
    return urls;
  }
  const post = { brand_id: 'b', kit_version: 1, body: 'p' } as unknown as Post;
  it('checks claims against the registered kit evidence, not live rows', async () => {
    const { policyCheck } = await import('../../worker/posts');
    const urls = stubKit([{ claim: 'Founded 2024', origin: 'source' }]);
    await policyCheck({ ...env, OPENROUTER_API_KEY: 'k' } as Env, post);
    expect(urls.some((u) => u.includes('/evidence?'))).toBe(false);
  });
  it('fails closed when evidence would need more than the allowed number of model calls', async () => {
    const { policyCheck } = await import('../../worker/posts');
    stubKit(Array.from({ length: 1000 }, (_, i) => ({ claim: `fact ${i} ${'z'.repeat(400)}`, origin: 'source' })));
    await expect(policyCheck({ ...env, OPENROUTER_API_KEY: 'k' } as Env, post)).rejects.toMatchObject({ status: 422 });
  });
});
