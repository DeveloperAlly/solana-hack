import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { strFromU8, unzipSync } from 'fflate';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example, exampleVersions } from './BuilderKitExport.example';
import { BuilderKitExport } from './BuilderKitExport';

// jsdom has no object URLs; stub them and catch the anchor click so no navigation happens.
let blobs: Blob[];
let downloads: string[];
beforeEach(() => {
  blobs = [];
  downloads = [];
  Object.assign(URL, { createObjectURL: vi.fn((b: Blob) => { blobs.push(b); return 'blob:kit'; }), revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloads.push(this.download); });
});
afterEach(() => vi.restoreAllMocks());

function readBlob(b: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer));
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(b);
  });
}
async function download(name: string) {
  await userEvent.click(screen.getByRole('button', { name: 'Download .zip' }));
  await screen.findByRole('heading', { name: `Saved ${name}` });
  return unzipSync(await readBlob(blobs[blobs.length - 1]));
}

describe('BuilderKitExport', () => {
  it('switching version changes the hash, tree and file name', async () => {
    renderWithRouter(example.render());
    expect(screen.getByText('[sha256 of v[n]]')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Version' }), 'v1 · [date]');
    expect(screen.getByText('[sha256 of kit v1]')).toBeInTheDocument();
    expect(screen.queryByText('[sha256 of v[n]]')).not.toBeInTheDocument();
    expect(screen.getByText(/^jamjam-kit-v1\//)).toBeInTheDocument();
  });

  it('zips the chosen version with its files; the include options change the file list, tree and contents', async () => {
    const { container } = renderWithRouter(example.render());
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Version' }), 'v1 · [date]');
    let files = await download('jamjam-kit-v1.zip');
    expect(Object.keys(files).sort()).toEqual(['jamjam-kit-v1/MANIFEST.md', 'jamjam-kit-v1/what/brand/02-purpose.md', 'jamjam-kit-v1/what/context/sources/jamjam-tech.md']);
    expect(strFromU8(files['jamjam-kit-v1/what/brand/02-purpose.md'])).toBe('# Purpose\n\n[JamJam purpose, kit v1]\n');
    expect(blobs[0].type).toBe('application/zip');
    expect(downloads).toEqual(['jamjam-kit-v1.zip']);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:kit');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Source list' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Missing sections as empty files' }));
    expect(screen.queryByText(/jamjam-tech\.md/)).not.toBeInTheDocument();
    expect(screen.getByText(/13-visual-kit\.md/)).toBeInTheDocument();
    files = await download('jamjam-kit-v1.zip');
    expect(Object.keys(files).sort()).toEqual(['jamjam-kit-v1/MANIFEST.md', 'jamjam-kit-v1/what/brand/02-purpose.md', 'jamjam-kit-v1/what/brand/13-visual-kit.md']);
    expect(files['jamjam-kit-v1/what/brand/13-visual-kit.md']).toHaveLength(0);
    await expectNoAxeViolations(container);
  });

  it('shows the preparing state with Download disabled', () => {
    renderWithRouter(<BuilderKitExport versions={exampleVersions} includes={[]} status="preparing" />);
    expect(screen.getByRole('heading', { name: 'Preparing jamjam-kit-v[n].zip' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download .zip' })).toBeDisabled();
  });

  it('shows the failure with Try again, and retries', async () => {
    vi.mocked(URL.createObjectURL).mockImplementationOnce(() => { throw new Error('blocked'); });
    renderWithRouter(example.render());
    await userEvent.click(screen.getByRole('button', { name: 'Download .zip' }));
    expect(await screen.findByRole('heading', { name: 'Could not build the download' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Saved jamjam-kit-v[n].zip' })).toBeInTheDocument();
    expect(downloads).toEqual(['jamjam-kit-v[n].zip']);
  });
});
