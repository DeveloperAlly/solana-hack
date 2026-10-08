import { describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { App } from '../../App';
import { kitMarkdown } from '../hub/Brand';
import type { BrandState } from '../build/Build';

describe('public pages', () => {
  for (const [path, heading] of [['/system', 'Workbench'], ['/how-it-works', 'How it works'], ['/verify', 'Check a post'], ['/ledger', 'Ledger'], ['/sign-in', 'Sign in to build your brand']]) {
    it(`${path} renders its heading with no axe violations`, async () => {
      const { container } = renderWithRouter(<App />, path);
      expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
      // jsdom cannot message iframes; the deployed Playwright axe run covers the /system preview frame.
      const r = await axe.run(container, { iframes: false, rules: { 'color-contrast': { enabled: false } } });
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
      kits: [{ id: 'k', version: 1, hash: 'sha256:abc', status: 'registered', signature: 'sig', attestation: 'att', created_at: '', error: null,
        payload: { sources: [{ id: 's', url: 'https://example.com', title: 'Example', status: 'read' }], sections: [{ section: 'purpose', body: 'Help brands prove what they said.', citations: ['e1'], status: 'approved' }], gates: [{ gate: 'purpose', approved_by: 'u', approved_at: '2026-10-08T00:00:00Z' }] } }],
    } as BrandState;
    const md = kitMarkdown(s);
    expect(md).toContain('# Waterlily brand kit');
    expect(md).toContain('fingerprint: sha256:abc');
    expect(md).toContain('section: purpose');
    expect(md).toContain('Help brands prove what they said.');
    expect(md).toContain('- purpose: approved 2026-10-08T00:00:00Z');
    expect(md).toContain('https://example.com');
  });
  it('exports the registered snapshot, not sections edited after registration', () => {
    const s = {
      brand: { id: 'b', name: 'Waterlily', type: 'company', description: null, website: null, goal: null, channel: null },
      answers: [], evidence: [], sources: [],
      sections: [{ section: 'purpose', body: 'Edited after v1.', citations: [], status: 'drafted' }],
      gates: [],
      kits: [{ id: 'k', version: 1, hash: 'sha256:abc', status: 'registered', signature: 'sig', attestation: 'att', created_at: '', error: null,
        payload: { sections: [{ section: 'purpose', body: 'The registered purpose.', citations: [], status: 'approved' }], gates: [{ gate: 'purpose', approved_by: 'u', approved_at: '2026-10-08T00:00:00Z' }] } }],
    } as unknown as BrandState;
    const md = kitMarkdown(s);
    expect(md).toContain('The registered purpose.');
    expect(md).toContain('# Waterlily brand kit');
    expect(md).not.toContain('Edited after v1.');
    expect(md).toContain('sections edited since v1 are not in this export');
    expect(md).toContain('- purpose: approved 2026-10-08T00:00:00Z');
  });
  it('uses the brand name registered in the snapshot, not a later rename', () => {
    const s = { brand: { name: 'Renamed' }, answers: [], evidence: [], sources: [], gates: [], sections: [],
      kits: [{ id: 'k', version: 1, hash: 'h', status: 'registered', signature: null, attestation: null, created_at: '', error: null,
        payload: { brand: { id: 'b', name: 'Original' }, sections: [], gates: [] } }] } as unknown as BrandState;
    expect(kitMarkdown(s)).toContain('# Original brand kit');
  });
  it('lists the sources recorded in the registered version, not ones added later', () => {
    const s = { brand: { name: 'W' }, answers: [], evidence: [], gates: [], sections: [],
      sources: [{ id: 's2', url: 'https://added-later.example', title: null, status: 'read', error: null }],
      kits: [{ id: 'k', version: 1, hash: 'h', status: 'registered', signature: null, attestation: null, created_at: '', error: null,
        payload: { sources: [{ id: 's1', url: 'https://original.example', title: 'Original', status: 'read' }], sections: [], gates: [] } }] } as unknown as BrandState;
    const md = kitMarkdown(s);
    expect(md).toContain('https://original.example');
    expect(md).not.toContain('added-later');
  });
  it('never lists live sources under a registered version that has no sources snapshot', () => {
    const s = { brand: { name: 'W' }, answers: [], evidence: [], gates: [], sections: [],
      sources: [{ id: 's9', url: 'https://live-only.example', title: null, status: 'read', error: null }],
      kits: [{ id: 'k', version: 1, hash: 'h', status: 'registered', signature: null, attestation: null, created_at: '', error: null, payload: { sections: [], gates: [] } }] } as unknown as BrandState;
    const md = kitMarkdown(s);
    expect(md).not.toContain('live-only');
    expect(md).toContain('sources were not recorded for this version');
  });
  it('labels an export with no registered kit as a draft', () => {
    const s = { brand: { name: 'W' }, answers: [], evidence: [], sources: [], gates: [], kits: [],
      sections: [{ section: 'purpose', body: 'Draft purpose.', citations: [], status: 'drafted' }] } as unknown as BrandState;
    expect(kitMarkdown(s)).toContain('version: draft (not registered)');
  });
});
