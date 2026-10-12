import { afterEach, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { Build } from './Build';

// Kit integrity in the Build UI (issue #31): the kit step names unapproved and stale sections, and an answer step
// shows the drafts its save made stale.
const brand = { id: '11111111-1111-1111-1111-111111111111', name: 'JamJam', type: 'company', description: null, website: null, goal: null, channel: null };
const gates = ['purpose', 'positioning', 'voice'].map((gate) => ({ gate, approved_by: 'u', approved_at: '2026-10-10T00:00:00Z', note: null }));
const base = {
  brand, sources: [], gates, kits: [],
  answers: [{ step: 'origin', data: { why: 'proof' }, skipped: false }],
  evidence: [{ id: 'e1', section: 'origin', claim: 'why: proof', quote: null, origin: 'owner_answer', source_id: null }],
  sections: [
    { section: 'purpose', body: 'p', citations: ['e1'], status: 'approved' },
    { section: 'positioning', body: 'p', citations: [], status: 'approved' },
    { section: 'voice', body: 'v', citations: [], status: 'approved' },
    { section: 'messaging', body: 'm', citations: [], status: 'drafted' },
    { section: 'origin', body: 'o', citations: ['gone'], status: 'approved' },
  ],
};

function mount(path: string, putReply: unknown = { answer: {}, stale: [] }) {
  const puts: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') puts.push(url);
    const body = url === '/api/me' ? { brands: [brand] } : init?.method === 'PUT' ? putReply : url === `/api/brands/${brand.id}` ? base : {};
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  }));
  const r = render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/build/*" element={<Build />} /></Routes></MemoryRouter>);
  return { ...r, puts };
}
afterEach(() => vi.unstubAllGlobals());

describe('Build kit integrity', () => {
  it('the kit step lists unapproved and stale sections and holds registration', async () => {
    const { container } = mount('/build/kit');
    const unapproved = await screen.findByText('Approve these sections before registering');
    expect(within(unapproved.parentElement!).getByRole('link', { name: 'Messaging' })).toHaveAttribute('href', '/build/messaging');
    const stale = screen.getByText(/These drafts used answers or sources you have since changed/);
    expect(within(stale.parentElement!).getByRole('link', { name: 'Origin story' })).toHaveAttribute('href', '/build/origin-draft');
    expect(screen.getByRole('button', { name: 'Register kit v1' })).toBeDisabled();
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(r.violations).toHaveLength(0);
  });
  it('an answer save that made drafts stale says so on that step instead of moving on', async () => {
    const { puts } = mount('/build/origin', { answer: {}, stale: ['purpose', 'origin'] });
    await userEvent.click(await screen.findByRole('button', { name: 'Save and continue' }));
    const notice = await screen.findByText('These drafts used your old answer: redraft them');
    expect(within(notice.parentElement!).getByRole('link', { name: 'Gate 1: purpose' })).toHaveAttribute('href', '/build/purpose');
    expect(within(notice.parentElement!).getByRole('link', { name: 'Origin story' })).toBeInTheDocument();
    expect(puts).toEqual([`/api/brands/${brand.id}/answers/origin`]);
    expect(screen.getByRole('heading', { level: 1, name: 'Origin' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });
});
