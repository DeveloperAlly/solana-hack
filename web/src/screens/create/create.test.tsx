import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithRouter } from '../../test/render';
import { Create } from './Create';

// Drafting on Workflows can outlast the request (issue #93; PR #99 review): POST /posts then answers 202 with the run
// id, and the screen follows the run (GET /api/runs/:id) until it finishes, then reloads the list.
const brand = { id: '11111111-1111-1111-1111-111111111111', name: 'JamJam' };
const done = { id: '33333333-3333-3333-3333-333333333333', brief: 'launch', channel: 'LinkedIn', body: 'Teams at 10 companies use JamJam.', status: 'drafted', kit_version: 1, hash: null, checks: { slop: { passed: true, hits: [] }, voiceFit: 80, platform: 100, notes: [], source: 'ai' }, signature: null, published_url: null, rev: 0 };

function mockApi(runStates: { status: string; error?: string }[]) {
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
    else if (url === '/api/runs/run-1') { const s = runStates[Math.min(polls, runStates.length - 1)]; polls++; body = { run: { id: 'run-1', status: s.status, error: s.error ?? null }, steps: [] }; }
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
});
