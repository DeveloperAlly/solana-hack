import { describe, expect, it } from 'vitest';
import { matchPost, similarity, wordDiff } from './matchPost';
import { adnaLaunchPost, adnaStandardPost, jamjamRetractedPost, registeredPosts } from './posts.fixtures';
import { verifyEdited, verifyNoMatch } from './verify.fixtures';
import { compareDate } from './useLedger';
import { formatDateTime } from './format';
import type { LedgerEntry } from './types';

describe('matchPost (local stand-in for POST /api/verify)', () => {
  it('matches the exact approved text, ignoring extra whitespace', () => {
    expect(matchPost(`  ${adnaLaunchPost.text.replace(/ /g, '   ')} `, registeredPosts)).toEqual({ kind: 'match', post: adnaLaunchPost });
  });
  it('reports a retracted post as retracted, not as a match', () => {
    expect(matchPost(jamjamRetractedPost.text, registeredPosts)).toEqual({ kind: 'retracted', post: jamjamRetractedPost });
  });
  it('finds the edited copy of the canvas Verify-3, with a phrase-level diff and the banned claim', () => {
    const r = matchPost(verifyEdited.query, registeredPosts);
    if (r.kind !== 'edited') throw new Error(`expected edited, got ${r.kind}`);
    expect(r.post).toBe(adnaStandardPost);
    expect(r.brokenClaim).toBe('10x');
    expect(r.diff).toEqual([
      { kind: 'same', text: "That's the gap aDNA fills: an open standard for project context" },
      { kind: 'removed', text: ' that any agent can read, version and audit. One shared file. No lock-in' },
      { kind: 'added', text: ". It will 10x your team's output" },
      { kind: 'same', text: '.' },
    ]);
  });
  it('reports unrelated text as not found', () => {
    expect(matchPost(verifyNoMatch.query, registeredPosts)).toEqual({ kind: 'nomatch' });
  });
});

describe('wordDiff and similarity', () => {
  it('keeps identical text as one unchanged run with similarity 1', () => {
    const d = wordDiff('a b c', 'a b c');
    expect(d).toEqual([{ kind: 'same', text: 'a b c' }]);
    expect(similarity(d)).toBe(1);
  });
  it('marks a replaced word as removed then added', () => {
    expect(wordDiff('one two three', 'one four three')).toEqual([
      { kind: 'same', text: 'one ' },
      { kind: 'removed', text: 'two' },
      { kind: 'added', text: 'four' },
      { kind: 'same', text: ' three' },
    ]);
  });
});

describe('ledger and format helpers', () => {
  const row = (date: string | null) => ({ date }) as LedgerEntry;
  it('orders dates ascending and treats a bracketed date as the latest', () => {
    expect(compareDate(row('2026-10-01'), row('2026-10-05'))).toBe(-1);
    expect(compareDate(row(null), row('2026-10-05'))).toBe(1);
    expect(compareDate(row(null), row(null))).toBe(0);
  });
  it('formats in the canvas style without time-zone shifts, and keeps brackets', () => {
    expect(formatDateTime('2026-10-05T16:18')).toBe('5 Oct 2026, 16:18');
    expect(formatDateTime('2026-10-05')).toBe('5 Oct 2026');
    expect(formatDateTime(null)).toBe('[date]');
  });
});
