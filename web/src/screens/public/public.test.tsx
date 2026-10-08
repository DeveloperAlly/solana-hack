import { describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { App } from '../../App';
import { kitMarkdown } from '../hub/Brand';
import type { BrandState } from '../build/Build';

describe('public pages', () => {
  for (const [path, heading] of [['/how-it-works', 'How it works'], ['/verify', 'Check a post'], ['/ledger', 'Ledger'], ['/sign-in', 'Sign in to build your brand']]) {
    it(`${path} renders its heading with no axe violations`, async () => {
      const { container } = renderWithRouter(<App />, path);
      expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
      const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
      if (r.violations.length) console.error(JSON.stringify(r.violations, null, 2));
      expect(r.violations).toHaveLength(0);
    });
  }
});

describe('kit export', () => {
  it('writes sections, gates and sources as aDNA-style Markdown', () => {
    const s = {
      brand: { id: 'b', name: 'Waterlily', type: 'company', description: null, website: null, goal: null, channel: null },
      answers: [], evidence: [],
      sources: [{ id: 's', url: 'https://example.com', title: 'Example', status: 'read', error: null }],
      sections: [{ section: 'purpose', body: 'Help brands prove what they said.', citations: ['e1'], status: 'approved' }],
      gates: [{ gate: 'purpose', approved_by: 'u', approved_at: '2026-10-08T00:00:00Z', note: null }],
      kits: [{ id: 'k', version: 1, hash: 'sha256:abc', status: 'registered', signature: 'sig', attestation: 'att', created_at: '', error: null }],
    } as BrandState;
    const md = kitMarkdown(s);
    expect(md).toContain('# Waterlily brand kit');
    expect(md).toContain('fingerprint: sha256:abc');
    expect(md).toContain('section: purpose');
    expect(md).toContain('Help brands prove what they said.');
    expect(md).toContain('- purpose: approved 2026-10-08T00:00:00Z');
    expect(md).toContain('https://example.com');
  });
});
