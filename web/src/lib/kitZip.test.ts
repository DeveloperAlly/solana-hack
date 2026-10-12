import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { buildKitZip, treePaths } from './kitZip';

const tree = 'kit-v1/\n  MANIFEST.md\n  what/\n    brand/          17 section files\n  how/';

describe('kit zip', () => {
  it('reads paths from the indented tree and drops the comments', () => {
    expect(treePaths(tree)).toEqual(['kit-v1/', 'kit-v1/MANIFEST.md', 'kit-v1/what/', 'kit-v1/what/brand/', 'kit-v1/how/']);
  });
  it('zips every folder and writes the manifest', () => {
    const files = unzipSync(buildKitZip({ tree, manifest: ['version: v1', 'hash: [sha256]'] }));
    expect(Object.keys(files).sort()).toEqual(['kit-v1/', 'kit-v1/MANIFEST.md', 'kit-v1/how/', 'kit-v1/what/', 'kit-v1/what/brand/']);
    expect(strFromU8(files['kit-v1/MANIFEST.md'])).toBe('version: v1\nhash: [sha256]\n');
  });
});
