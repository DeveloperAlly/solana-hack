import { describe, expect, it } from 'vitest';
import { PASTE_MAX_CHARS, readPaste } from '../../worker/sources/paste';

describe('paste adapter (issue #33)', () => {
  it('keeps the owner\'s text whole as an owned source', () => {
    const r = readPaste({ text: 'Our mission\r\nHelp brands prove what they say.\n', name: 'About us' });
    expect(r).toMatchObject({ ok: true, kind: 'paste', trust: 'owned', name: 'About us', title: 'About us', text: 'Our mission\nHelp brands prove what they say.', meta: { pages: 1, cost: 0, via: 'paste' } });
  });
  it('titles an unnamed paste from its first line', () => {
    expect(readPaste({ text: 'First line here\nmore' })).toMatchObject({ ok: true, title: 'First line here' });
  });
  it('keeps a numbers-only paste such as a price list or metrics (PR #71 review)', () => {
    const r = readPaste({ text: '| 2026-10-01 | $1,000 | 42% |\n| 2026-10-08 | $2,500 | 7% |' });
    expect(r).toMatchObject({ ok: true, kind: 'paste' });
    expect(r.ok && r.text).toContain('$2,500');
  });
  it('refuses empty and over-long pastes with a reason, never cutting them', () => {
    expect(readPaste({ text: '  \n ... -- | ' })).toMatchObject({ ok: false, code: 'empty' });
    expect(readPaste({ text: 'a'.repeat(PASTE_MAX_CHARS + 1) })).toMatchObject({ ok: false, code: 'too_large', reason: expect.stringContaining('split it') });
    expect(readPaste({ text: undefined as unknown as string })).toMatchObject({ ok: false, code: 'empty' });
  });
});
