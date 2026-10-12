import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { Post } from '../../../worker/posts';
import type { JourneyBrandState } from './contract';
const mock = vi.hoisted(() => ({ api: vi.fn(), refresh: vi.fn(async () => {}), session: { user: { id: 'owner', email: 'owner@example.com', is_anonymous: false } } }));
vi.mock('../../lib/api', async original => ({ ...await original<typeof import('../../lib/api')>(), api: mock.api }));
vi.mock('../../lib/auth', () => ({ useAuth: () => ({ session: mock.session }) }));
vi.mock('../../lib/liveBrands', () => ({ useLiveBrands: () => ({ id: 'brand', refresh: mock.refresh }) }));
vi.mock('./auth', () => ({ ensureJourneySession: vi.fn(), finishJourneySignIn: vi.fn(), pendingJourneyEmail: () => '', sendJourneyEmail: vi.fn() }));
import { LiveJourneyProvider, LiveJourneyScreen } from './LiveJourney';
const base: JourneyBrandState = { brand: { id: 'brand', name: 'Brand', website: 'https://brand.example' }, evidence: [], sources: [], answers: [], sections: [], gates: [], kits: [{ id: 'kit', version: 1, status: 'registered', hash: 'kit-hash' }], coverage: { sections: [], ratio: 0 }, journey: { read: { site: 'brand.example', sources: [], facts: [], coverage: { found: 0, partly: 0, needsYou: 6, percent: 0 } }, confirm: { facts: [], voice: { id: 'voice', section: 'Voice', status: 'needs-you', statement: 'Choose a voice' }, missing: { id: 'missing', section: 'Kit', status: 'needs-you', statement: 'Answer gaps' }, readinessBase: 0, questionsLeft: 1, timeLeft: '1 minute', deferredNote: '' }, gapsVoice: { brandName: 'Brand', alternatives: { question: '', hint: '', options: [], source: '' }, edgeQuestion: '', originQuestion: '', originNote: '', questions: [{ id: 'origin.why', step: 'origin', field: 'origin.why', question: 'Why does this brand exist?', kind: 'missing', optional: false, sections: ['origin'] }] } } };
let state: JourneyBrandState;
let post: Post;
beforeEach(() => {
  cleanup(); mock.api.mockReset(); sessionStorage.clear(); sessionStorage.setItem('jamjam.journey.brandId', 'brand');
  state = structuredClone(base);
  post = { id: 'post', brand_id: 'brand', brief: 'Launch', channel: 'LinkedIn', body: 'We help founders.', rev: 1, status: 'drafted', kit_version: 1, hash: null, signature: null, attestation: null, published_url: null, created_at: '', approved_by: null, approved_at: null, checks: { slop: { passed: true, hits: [] }, voiceFit: 80, platform: 80, notes: [] } };
  mock.api.mockImplementation(async (path: string, init?: { body?: Record<string, unknown>; method?: string }) => {
    if (path === '/brands/brand') return structuredClone(state);
    if (path.includes('/runs?')) return { runs: [] };
    if (path === '/brands/brand/posts?limit=1') return { posts: [structuredClone(post)] };
    if (path.endsWith('/claims')) return { claimMap: { rev: post.rev, claimsGate: '5', items: [{ text: post.body, kind: 'factual', status: 'supported', facts: [{ id: 'fact', claim: 'We help founders.', quote: 'We help founders.' }] }], unsupported: 0, partial: false } };
    if (path.endsWith('/voice/samples')) return { samples: [{ template: 'candid_founder', label: 'Candid founder', text: init?.body?.round === 2 ? 'Second sample' : 'First sample', answer: { template: 'candid_founder', sample: 'Second sample', claims: '4' } }] };
    if (path.includes('/answers/')) return { answer: {} };
    if (path.endsWith('/approve')) { post = { ...post, status: 'approved', approved_by: 'owner', approved_at: 'now', rev: post.rev + 1 }; return { post: structuredClone(post) }; }
    if (path.endsWith('/register')) { post = { ...post, status: 'registered', signature: 'real-server-signature', hash: 'registered-hash' }; return { post: structuredClone(post) }; }
    if (path === '/verify') return { official: init?.body?.text === post.body, checked: true };
    throw new Error(`Unexpected API ${path}`);
  });
});
function at(step: string) {
  return render(<MemoryRouter initialEntries={[`/journey/${step}`]}><LiveJourneyProvider><Routes><Route path="/journey/gapsVoice" element={<LiveJourneyScreen target="gapsVoice" />} /><Route path="/journey/approveKit" element={<div>Kit review route</div>} /><Route path="/journey/firstPost" element={<LiveJourneyScreen target="firstPost" />} /><Route path="/journey/proof" element={<LiveJourneyScreen target="proof" />} /></Routes></LiveJourneyProvider></MemoryRouter>);
}
describe('Live Journey endpoint integration', () => {
  it('writes authoritative gap answers using server step keys and persists the chosen voice before advancing', async () => {
    at('gapsVoice');
    await screen.findByText('First sample');
    await userEvent.type(screen.getByLabelText('Why does this brand exist?'), 'Founders need help');
    await userEvent.click(screen.getByRole('radio', { name: /Candid founder/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next round' }));
    await screen.findByText('Second sample');
    await userEvent.click(screen.getByRole('radio', { name: /Candid founder/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Review my kit' }));
    await screen.findByText('Kit review route');
    expect(mock.api).toHaveBeenCalledWith('/brands/brand/answers/origin', expect.objectContaining({ method: 'PUT', body: { data: { why: 'Founders need help' }, skipped: false } }));
    expect(mock.api).toHaveBeenCalledWith('/brands/brand/answers/voice', expect.objectContaining({ body: { data: { template: 'candid_founder', sample: 'Second sample', claims: '5' }, skipped: false } }));
  });
  it('requires server approval and registration, then checks public proof through the API', async () => {
    at('firstPost');
    const approve = await screen.findByRole('button', { name: 'Approve and register' });
    await waitFor(() => expect(approve).not.toBeDisabled());
    await userEvent.click(approve);
    await screen.findByRole('heading', { name: 'Your first post is registered' });
    expect(mock.api).toHaveBeenCalledWith('/brands/brand/posts/post/approve', expect.objectContaining({ body: { rev: 1 } }));
    expect(mock.api).toHaveBeenCalledWith('/brands/brand/posts/post/register', expect.objectContaining({ body: { rev: 2 } }));
    expect(screen.queryByText('Official')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Check' }));
    await screen.findByRole('heading', { name: 'Official' });
    expect(mock.api).toHaveBeenCalledWith('/verify', { body: { text: 'We help founders.' } });
  });
  it('keeps the user on the draft when chain registration fails and never shows a fake proof', async () => {
    const normal = mock.api.getMockImplementation()!;
    mock.api.mockImplementation((path, init) => path.endsWith('/register') ? Promise.reject(new Error('RPC unavailable')) : normal(path, init));
    at('firstPost');
    const approve = await screen.findByRole('button', { name: 'Approve and register' });
    await waitFor(() => expect(approve).not.toBeDisabled());
    await userEvent.click(approve);
    await screen.findByText('RPC unavailable');
    expect(screen.queryByRole('heading', { name: 'Your first post is registered' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your first post, from kit v1' })).toBeInTheDocument();
  });
});
