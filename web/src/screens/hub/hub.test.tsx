import { afterEach, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { Home } from './Home';
import { Brand } from './Brand';
import { Settings } from './Settings';
import { Create } from '../create/Create';

const brand = { id: '11111111-1111-1111-1111-111111111111', name: 'Waterlily', type: 'company', description: 'Build your brand, run it, prove it.', website: null, goal: null, channel: 'LinkedIn' };
const state = {
  brand, answers: [], evidence: [{ id: 'e1', section: 'purpose', claim: 'why: brands need proof', quote: null, origin: 'owner_answer', source_id: null }],
  sources: [{ id: 's1', url: 'https://example.com', title: 'Example', status: 'read', error: null }],
  sections: [{ section: 'purpose', body: 'Help brands prove what they said.', citations: ['e1'], status: 'approved' }],
  gates: [{ gate: 'purpose', approved_by: 'u', approved_at: '2026-10-08T00:00:00Z', note: null }],
  kits: [],
};
const post = { id: '22222222-2222-2222-2222-222222222222', brief: 'launch', channel: 'LinkedIn', body: 'We built Waterlily.', status: 'drafted', kit_version: 1, hash: null, checks: { slop: { passed: true, hits: [] }, voiceFit: 82, platform: 74, notes: [], history: ['Earlier text'] }, signature: null, published_url: null };

function mockApi() {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const body = url === '/api/me' ? { user: { email: 'owner@example.com' }, brands: [brand] }
      : url === '/api/health' ? { ok: true, registrar: 'E6nY1Wzgish68uZNeJDJKk2wAUWmYwG8yXSZeTSuDvMG', rpcConfigured: true, aiConfigured: true, model: 'openrouter/auto' }
      : /\/posts(\?limit=\d+)?$/.test(url) ? { posts: [post], more: false }
      : url === `/api/brands/${brand.id}` ? state : {};
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  }));
}
afterEach(() => vi.unstubAllGlobals());

async function noViolations(container: HTMLElement) {
  const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  if (r.violations.length) console.error(JSON.stringify(r.violations, null, 2));
  expect(r.violations).toHaveLength(0);
}

describe('hub screens (mocked API)', () => {
  it('Home shows the next action and status cards', async () => {
    mockApi();
    const { container } = renderWithRouter(<Home />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Waterlily' })).toBeInTheDocument();
    expect(screen.getAllByText('Continue building your brand').length).toBeGreaterThan(0);
    expect(screen.getByText('1 of 3 approved')).toBeInTheDocument();
    await noViolations(container);
  });
  it('Brand lists sections with status and offers export', async () => {
    mockApi();
    const { container } = renderWithRouter(<Brand />);
    expect(await screen.findByText('Help brands prove what they said.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export (aDNA Markdown)' })).toBeInTheDocument();
    await noViolations(container);
  });
  it('Settings is honest about what is live', async () => {
    mockApi();
    const { container } = renderWithRouter(<Settings />);
    expect(await screen.findByText(/openrouter\/auto/)).toBeInTheDocument();
    expect(screen.getAllByText('Coming soon').length).toBeGreaterThan(0);
    await noViolations(container);
  });
  it('Create shows checks, the polish bar and undo', async () => {
    mockApi();
    const { container } = renderWithRouter(<Create />);
    expect(await screen.findByText('Voice fit: 82')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Polish' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Beautify (accessible)' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
    await noViolations(container);
  });
});
