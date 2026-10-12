import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderKitExport.example';
import { BuilderKitExport } from './BuilderKitExport';

const versions = [{ label: 'v1', hash: '[sha256 of kit v1]', fileName: 'jamjam-kit-v1.zip', tree: 'jamjam-kit-v1/\n  MANIFEST.md' }];

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

describe('BuilderKitExport', () => {
  it('switching version changes the hash, tree and file name', async () => {
    renderWithRouter(example.render());
    expect(screen.getByText('[sha256 of v[n]]')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Version' }), 'v1 · [date]');
    expect(screen.getByText('[sha256 of kit v1]')).toBeInTheDocument();
    expect(screen.queryByText('[sha256 of v[n]]')).not.toBeInTheDocument();
    expect(screen.getByText(/^jamjam-kit-v1\//)).toBeInTheDocument();
  });

  it('builds the zip for the chosen version and saves it: preparing, then saved, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    await userEvent.click(screen.getByRole('checkbox', { name: 'Missing sections as empty files' }));
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Version' }), 'v1 · [date]');
    await userEvent.click(screen.getByRole('button', { name: 'Download .zip' }));
    expect(await screen.findByRole('heading', { name: 'Saved jamjam-kit-v1.zip' })).toBeInTheDocument();
    expect(blobs).toHaveLength(1);
    expect(blobs[0].type).toBe('application/zip');
    expect(blobs[0].size).toBeGreaterThan(0);
    expect(downloads).toEqual(['jamjam-kit-v1.zip']);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:kit');
    await expectNoAxeViolations(container);
  });

  it('shows the preparing state with Download disabled', () => {
    renderWithRouter(<BuilderKitExport versions={versions} includes={[]} status="preparing" />);
    expect(screen.getByRole('heading', { name: 'Preparing jamjam-kit-v1.zip' })).toBeInTheDocument();
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
