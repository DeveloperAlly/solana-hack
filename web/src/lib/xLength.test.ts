import { describe, expect, it } from 'vitest';
import { platformLimit, xWeightedLength } from './xLength';
import { platformLimit as workerLimit, xWeightedLength as workerLength } from '../../worker/posts';

const samples = [
  '',
  'Plain ASCII text.',
  'A link https://adna.network/docs, then more.',
  'Two links http://a.example and https://b.example/x?y=1).',
  'Emoji 🚀 and a flag 🇦🇺 and a keycap 1️⃣ here.',
  'CJK 日本語のテキスト and Korean 한국어',
  'Curly quotes “like this” and an ellipsis…',
  'a'.repeat(281),
];

describe('lib/xLength (parity with web/worker/posts.ts)', () => {
  it('counts every sample exactly as the Worker does', () => {
    for (const s of samples) expect(xWeightedLength(s)).toBe(workerLength(s));
  });
  it('has the same channel limits as the Worker', () => {
    for (const c of ['X', ' twitter ', 'LinkedIn', null, 'Blog']) expect(platformLimit(c)).toBe(workerLimit(c));
  });
  it('weights URLs at 23 and CJK at 2', () => {
    expect(xWeightedLength('https://example.com/a/very/long/path/that/is/long')).toBe(23);
    expect(xWeightedLength('日本')).toBe(4);
  });
});
