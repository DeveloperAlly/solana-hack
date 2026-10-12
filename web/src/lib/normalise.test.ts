// Parity: the browser's normalise must equal the Worker's (web/worker/posts.ts:42), or a post the Worker would verify
// could show as not official in the gallery, and the other way round (Codex review on PR #75).
import { describe, expect, it } from 'vitest';
import { normalise } from './normalise';
import { normalise as workerNormalise } from '../../worker/posts';

const inputs = [
  'Anyone can check what really came from you.',
  '  leading and trailing  ',
  'tabs\tand  double  spaces',
  'line\nwraps\r\nand\n\nblank lines',
  'non breaking spaces',
  'café (NFD)',
  'café (NFC)',
  '',
];

describe('normalise', () => {
  it.each(inputs)('matches the Worker for %j', (s) => {
    expect(normalise(s)).toBe(workerNormalise(s));
  });
  it('folds NFD into NFC and collapses whitespace', () => {
    expect(normalise('café\n  au  lait')).toBe('café au lait');
  });
});
