import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithRouter } from '../../test/render';
import { expectNoAxeViolations } from '../../test/axe';
import { example } from './BuilderKitExport.example';

describe('BuilderKitExport', () => {
  it('switching version changes the hash, tree and file name', async () => {
    renderWithRouter(example.render());
    expect(screen.getByText('[sha256 of v[n]]')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Version' }), 'v1 · [date]');
    expect(screen.getByText('[sha256 of kit v1]')).toBeInTheDocument();
    expect(screen.queryByText('[sha256 of v[n]]')).not.toBeInTheDocument();
    expect(screen.getByText(/^jamjam-kit-v1\//)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Download .zip' }));
    expect(screen.getByRole('heading', { name: 'Preparing jamjam-kit-v1.zip' })).toBeInTheDocument();
  });
  it('toggles include options, picks a version and prepares the download, with no axe violations', async () => {
    const { container } = renderWithRouter(example.render());
    const missing = screen.getByRole('checkbox', { name: 'Missing sections as empty files' });
    await userEvent.click(missing);
    expect(missing).toBeChecked();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Version' }), 'v1 · [date]');
    expect(screen.getByRole('combobox', { name: 'Version' })).toHaveValue('v1 · [date]');
    await userEvent.click(screen.getByRole('button', { name: 'Download .zip' }));
    expect(screen.getByRole('heading', { name: /^Preparing jamjam-kit-v/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download .zip' })).toBeDisabled();
    await expectNoAxeViolations(container);
  });
});
