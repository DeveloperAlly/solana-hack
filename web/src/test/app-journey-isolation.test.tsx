import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
const calls = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock('../lib/api', async original => ({ ...await original<typeof import('../lib/api')>(), api: calls.api }));
vi.mock('../lib/supabase', () => ({ supabase: null }));
vi.mock('../lib/auth', () => ({
  useAuth: () => ({ session: { user: { id: 'owner', email: 'owner@example.test', is_anonymous: false } }, loading: false }),
  RequireAuth: ({ children }: { children: ReactNode }) => children,
}));
import { App } from '../App';
import { LiveBrandProvider } from '../lib/liveBrands';
import { resetJourneyFlow } from '../screens/journey/useJourneyFlow';

const brand = { id: 'brand', owner_id: 'owner', name: 'Stored brand', website: 'https://stored.example' };
const state = { brand, evidence: [{ id: 'fact', section: 'purpose', claim: 'Persisted source fact', quote: 'Persisted source fact', source_id: null, review_status: 'approved' }], sources: [], answers: [], sections: [], gates: [], kits: [], coverage: { sections: [], ratio: 0 } };
function mount(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><LiveBrandProvider><App /></LiveBrandProvider></MemoryRouter>);
}
beforeEach(() => {
  calls.api.mockReset(); sessionStorage.clear(); resetJourneyFlow();
  sessionStorage.setItem('jamjam.journey.brandId', 'brand');
  calls.api.mockImplementation(async (path: string) => {
    if (path === '/me') return { brands: [brand] };
    if (path === '/brands/brand') return structuredClone(state);
    if (path.includes('/runs?')) return { runs: [] };
    throw new Error(`Unexpected API ${path}`);
  });
});

describe('App live Journey provider boundary (#114)', () => {
  it.each(['/screens/Main', '/screens/J1-Read', '/screens/J6-First-Post', '/preview/J1-Read', '/preview/J6-First-Post'])('%s keeps stored live brand data and actions outside previews', async path => {
    mount(path);
    await screen.findByRole('heading', { level: 1 });
    // Flush mounted provider effects and queued promise updates; a stored Journey must not resume on these routes.
    await act(async () => { await Promise.resolve(); });
    expect(calls.api).not.toHaveBeenCalled();
    expect(screen.queryByText('Persisted source fact')).not.toBeInTheDocument();
  });

  it('the real Journey route loads authoritative brand data and resumes its persisted reads', async () => {
    mount('/journey/read');
    await screen.findByText('Persisted source fact');
    await waitFor(() => expect(calls.api).toHaveBeenCalledWith('/brands/brand/runs?kind=extract_facts', expect.objectContaining({ signal: expect.any(AbortSignal) })));
    expect(calls.api).toHaveBeenCalledWith('/brands/brand', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
});
