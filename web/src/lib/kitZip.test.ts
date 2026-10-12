import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { buildKitZip, kitFiles, kitTree, type KitFile } from './kitZip';

const files: KitFile[] = [
  { path: 'MANIFEST.md', content: 'version: v1\n' },
  { path: 'what/brand/01-identity.md', content: '# Identity\n' },
  { path: 'what/brand/13-visual-kit.md', content: '', group: 'missing' },
  { path: 'what/decisions/gate-1-purpose.md', content: 'Approved\n', group: 'decisions' },
];

describe('kit zip', () => {
  it('keeps only the files the ticked options include', () => {
    expect(kitFiles(files, new Set()).map((f) => f.path)).toEqual(['MANIFEST.md', 'what/brand/01-identity.md']);
    expect(kitFiles(files, new Set(['decisions', 'missing']))).toHaveLength(4);
  });
  it('draws the tree from the files', () => {
    expect(kitTree('kit-v1', kitFiles(files, new Set(['decisions'])))).toBe(
      'kit-v1/\n  MANIFEST.md\n  what/\n    brand/\n      01-identity.md\n    decisions/\n      gate-1-purpose.md',
    );
  });
  it('zips every file under the root with its content', () => {
    const out = unzipSync(buildKitZip('kit-v1', files));
    expect(Object.keys(out).sort()).toEqual(files.map((f) => `kit-v1/${f.path}`).sort());
    expect(strFromU8(out['kit-v1/what/brand/01-identity.md'])).toBe('# Identity\n');
  });
});
