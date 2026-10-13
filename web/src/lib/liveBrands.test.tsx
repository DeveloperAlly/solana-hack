import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { LiveBrandProvider, useLiveBrands } from './liveBrands';
import { useBrand } from './useBrand';
import { Create } from '../screens/create/Create';

vi.mock('./auth', () => ({ useAuth: () => ({ session: { user: { id: 'owner', email: 'owner@example.test' } }, loading: false }) }));
const brands = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }];
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
const post = (id: string, body: string) => ({ id, body, channel: 'LinkedIn', brief: 'Launch', status: 'drafted', kit_version: 1, hash: null, checks: { slop: { passed: true, hits: [] }, source: 'edit' }, signature: null, published_url: null, rev: 0 });
function Choices() { const c = useLiveBrands(); return <>{c.brands.map(b => <button key={b.id} onClick={() => c.select(b.id)}>Select {b.name}</button>)}</>; }
function BrandView() { const b = useBrand(); return <p>{b.state?.brand.name ?? 'Waiting'}</p>; }
function mount(path: string, children: React.ReactNode) { return render(<MemoryRouter initialEntries={[path]}><LiveBrandProvider><Choices />{children}</LiveBrandProvider></MemoryRouter>); }
beforeEach(() => sessionStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('live account isolation (#114)', () => {
  it.each(['/screens', '/preview/Today', '/distribute', '/grow', '/learn'])('signed-in %s does not fetch account data', async path => {
    const fetcher = vi.fn(() => Promise.resolve(json({ brands })));
    vi.stubGlobal('fetch', fetcher);
    mount(path, null);
    await waitFor(() => expect(fetcher).not.toHaveBeenCalled());
  });
  it('an older brand response cannot replace the newly selected brand', async () => {
    let complete!: (r: Response) => void;
    vi.stubGlobal('fetch', vi.fn((url: string) => url === '/api/me' ? Promise.resolve(json({ brands })) : url === '/api/brands/a' ? new Promise<Response>(r => { complete = r; }) : Promise.resolve(json({ brand: brands[1] }))));
    mount('/home', <BrandView />);
    await screen.findByRole('button', { name: 'Select Beta' });
    await waitFor(() => expect(complete).toBeDefined());
    await userEvent.click(screen.getByRole('button', { name: 'Select Beta' }));
    await screen.findByText('Beta');
    complete(json({ brand: brands[0] }));
    await waitFor(() => expect(screen.queryByText('Alpha')).not.toBeInTheDocument());
  });
  it('late posts from Alpha cannot appear under Beta', async () => {
    let complete!: (r: Response) => void;
    vi.stubGlobal('fetch', vi.fn((url: string) => url === '/api/me' ? Promise.resolve(json({ brands })) : url.includes('/runs?') ? Promise.resolve(json({ runs: [] })) : url.includes('/brands/a/posts?') ? new Promise<Response>(r => { complete = r; }) : Promise.resolve(json({ posts: [post('bp', 'Beta post')] }))));
    mount('/create', <Create />);
    await waitFor(() => expect(complete).toBeDefined());
    await userEvent.click(screen.getByRole('button', { name: 'Select Beta' }));
    await screen.findByDisplayValue('Beta post');
    complete(json({ posts: [post('ap', 'Alpha post')] }));
    await waitFor(() => expect(screen.queryByDisplayValue('Alpha post')).not.toBeInTheDocument());
    expect(screen.getByDisplayValue('Beta post')).toBeInTheDocument();
  });
  it('a late Alpha mutation callback does not reload Alpha into Beta', async () => {
    let complete!: (r: Response) => void;
    let alphaReads = 0;
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (url === '/api/me') return Promise.resolve(json({ brands }));
      if (url.includes('/runs?')) return Promise.resolve(json({ runs: [] }));
      if (init?.method === 'PUT') return new Promise<Response>(r => { complete = r; });
      if (url.includes('/brands/a/posts?')) { alphaReads++; return Promise.resolve(json({ posts: [post('ap', 'Alpha post')] })); }
      return Promise.resolve(json({ posts: [post('bp', 'Beta post')] }));
    }));
    mount('/create', <Create />);
    const text = await screen.findByDisplayValue('Alpha post');
    await userEvent.type(text, ' edited');
    await userEvent.click(screen.getByRole('button', { name: 'Save edits' }));
    await userEvent.click(screen.getByRole('button', { name: 'Select Beta' }));
    await screen.findByDisplayValue('Beta post');
    complete(json({ post: post('ap', 'Alpha post edited') }));
    await waitFor(() => expect(alphaReads).toBe(1));
    expect(screen.queryByDisplayValue('Alpha post edited')).not.toBeInTheDocument();
  });
});
