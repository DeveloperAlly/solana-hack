import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { renderWithRouter } from '../../test/render';
import { Create } from './Create';

// Drafting on Workflows can outlast the request (issue #93; PR #99 review): POST /posts then answers 202 with the run
// id, and the screen follows the run (GET /api/runs/:id) until it finishes, then reloads the list.
const brand = { id: '11111111-1111-1111-1111-111111111111', name: 'JamJam' };
const done = { id: '33333333-3333-3333-3333-333333333333', brief: 'launch', channel: 'LinkedIn', body: 'Teams at 10 companies use JamJam.', status: 'drafted', kit_version: 1, hash: null, checks: { slop: { passed: true, hits: [] }, voiceFit: 80, platform: 100, notes: [], source: 'ai' }, signature: null, published_url: null, rev: 0 };

function mockApi(runStates: { status: string; error?: string; resume_at?: string }[], going: { id: string }[] = []) {
  let posted = false;
  let polls = 0;
  const seen: string[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    seen.push(`${init?.method ?? 'GET'} ${url}`);
    let body: unknown = {};
    let status = 200;
    if (url === '/api/me') body = { user: { email: 'o@example.com' }, brands: [brand] };
    else if (/\/posts\?limit=\d+$/.test(url)) body = { posts: posted && runStates.at(-1)!.status === 'done' && polls >= runStates.length ? [done] : [], more: false };
    else if (url.endsWith('/posts') && init?.method === 'POST') { posted = true; status = 202; body = { post: null, runId: 'run-1', status: 'running', message: 'Still drafting your post. It will appear in your list shortly.' }; }
    else if (url === `/api/brands/${brand.id}/runs?kind=draft_post`) { body = { runs: going }; if (going.length) posted = true; }
    else if (url === '/api/runs/run-1') { const s = runStates[Math.min(polls, runStates.length - 1)]; polls++; body = { run: { id: 'run-1', status: s.status, error: s.error ?? null, resume_at: s.resume_at ?? null }, steps: [] }; }
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  }));
  return seen;
}
afterEach(() => vi.unstubAllGlobals());

async function submit() {
  renderWithRouter(<Create />);
  const brief = await screen.findByLabelText('What is the post about?');
  fireEvent.change(brief, { target: { value: 'launch' } });
  fireEvent.click(screen.getByRole('button', { name: 'Draft a post' }));
}

describe('Create follows a draft that outlasts the request', () => {
  it('polls the run until it is done, then shows the new post', async () => {
    const seen = mockApi([{ status: 'running' }, { status: 'done' }]);
    await submit();
    expect(await screen.findByDisplayValue('Teams at 10 companies use JamJam.', {}, { timeout: 8000 })).toBeInTheDocument();
    expect(seen.filter((s) => s === 'GET /api/runs/run-1')).toHaveLength(2);
    expect(screen.queryByRole('alert')).toBeNull();
  }, 10000);

  it('shows the run\'s error when it fails', async () => {
    mockApi([{ status: 'failed', error: 'the AI model is busy, try again in a minute' }]);
    await submit();
    expect(await screen.findByText('the AI model is busy, try again in a minute', {}, { timeout: 8000 })).toBeInTheDocument();
  }, 10000);

  it('resumes following a draft still going when the page is opened again, and shows a pause for the allowance', async () => {
    mockApi([{ status: 'paused', resume_at: '2026-10-14T00:00:00Z' }, { status: 'done' }], [{ id: 'run-1' }]);
    renderWithRouter(<Create />);
    expect(await screen.findByText(/Waiting for the AI model's daily allowance/)).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Teams at 10 companies use JamJam.', {}, { timeout: 8000 })).toBeInTheDocument();
    expect(screen.queryByText(/Waiting for the AI model's daily allowance/)).toBeNull();
  }, 10000);

  it('follows the run under StrictMode, whose effect runs set up, clean up and set up again', async () => {
    const seen = mockApi([{ status: 'running' }, { status: 'done' }]);
    // StrictMode at the root, as web/src/main.tsx mounts the app.
    render(<StrictMode><MemoryRouter><Create /></MemoryRouter></StrictMode>);
    const brief = await screen.findByLabelText('What is the post about?');
    fireEvent.change(brief, { target: { value: 'launch' } });
    fireEvent.click(screen.getByRole('button', { name: 'Draft a post' }));
    expect(await screen.findByDisplayValue('Teams at 10 companies use JamJam.', {}, { timeout: 8000 })).toBeInTheDocument();
    expect(seen.filter((x) => x === 'GET /api/runs/run-1')).toHaveLength(2);
  }, 10000);

  it('asks for runs still going before loading the list, so a run that ends in between is not lost', async () => {
    // A controllable fake: the run is still going when the runs list is read, and finishes as the post list is read.
    let state: 'running' | 'done' = 'running';
    const order: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      let body: unknown = {};
      if (url === '/api/me') body = { user: { email: 'o@example.com' }, brands: [brand] };
      else if (url === `/api/brands/${brand.id}/runs?kind=draft_post`) { order.push('runs'); body = { runs: state === 'running' ? [{ id: 'run-1' }] : [] }; }
      else if (/\/posts\?limit=\d+$/.test(url)) { order.push('list'); body = { posts: state === 'done' && order.filter((o) => o === 'list').length > 1 ? [done] : [], more: false }; state = 'done'; }
      else if (url === '/api/runs/run-1') { order.push('poll'); body = { run: { id: 'run-1', status: state, error: null, resume_at: null }, steps: [] }; }
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    }));
    renderWithRouter(<Create />);
    expect(await screen.findByDisplayValue('Teams at 10 companies use JamJam.', {}, { timeout: 8000 })).toBeInTheDocument();
    expect(order.slice(0, 2)).toEqual(['runs', 'list']);
  }, 10000);
});
