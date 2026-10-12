import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithRouter } from '../../test/render';
import { AppShell } from './AppShell';
import { hubNav } from '../../config/routes';
import { GalleryModeContext } from '../hooks/galleryMode';

const signOut = vi.fn(async () => ({ error: null }));
vi.mock('../../lib/supabase', () => ({ supabase: { auth: { signOut: () => signOut() } } }));

describe('L1 AppShell', () => {
  it('shows the hub nav with tags, the brand name and a main landmark', () => {
    renderWithRouter(<AppShell brandName="Acme"><p>content</p></AppShell>, '/home');
    const nav = screen.getByRole('navigation', { name: 'Hub' });
    expect(within(nav).getAllByRole('link')).toHaveLength(hubNav.length);
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('content');
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  });
  it('signs out and returns to the landing page', async () => {
    renderWithRouter(
      <Routes>
        <Route path="/home" element={<AppShell>hub</AppShell>} />
        <Route path="/" element={<p>landing</p>} />
      </Routes>,
      '/home',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(signOut).toHaveBeenCalled();
    expect(await screen.findByText('landing')).toBeInTheDocument();
  });
  it('inside the gallery, Sign out calls no Supabase method and stays on the screen', async () => {
    signOut.mockClear();
    renderWithRouter(
      <GalleryModeContext.Provider value={true}>
        <Routes>
          <Route path="/screens/X" element={<AppShell>gallery screen</AppShell>} />
          <Route path="/" element={<p>landing</p>} />
        </Routes>
      </GalleryModeContext.Provider>,
      '/screens/X',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(signOut).not.toHaveBeenCalled();
    expect(screen.getByText('gallery screen')).toBeInTheDocument();
  });
  it('navHref maps every nav link and the logo', () => {
    renderWithRouter(<AppShell navHref={(p) => `/screens${p}`}>x</AppShell>);
    const nav = screen.getByRole('navigation', { name: 'Hub' });
    within(nav).getAllByRole('link').forEach((a, i) => expect(a).toHaveAttribute('href', `/screens${hubNav[i].path}`));
    expect(screen.getAllByRole('link').find((a) => a.getAttribute('href') === '/screens/home')).toBeDefined();
  });
  it('marks the current item from activePath and renders a custom nav and subnav', () => {
    renderWithRouter(<AppShell nav={hubNav.slice(0, 2)} activePath={hubNav[1].path} subnav={<p>tabs</p>}>x</AppShell>, '/elsewhere');
    const nav = screen.getByRole('navigation', { name: 'Hub' });
    expect(within(nav).getAllByRole('link')).toHaveLength(2);
    expect(within(nav).getAllByRole('link')[1]).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('tabs')).toBeInTheDocument();
  });
  it('preview adds no main landmark or skip link and does not sign out', async () => {
    signOut.mockClear();
    renderWithRouter(<AppShell preview brandName="Acme">x</AppShell>);
    expect(screen.queryByRole('main')).toBeNull();
    expect(screen.queryByText('Skip to content')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Hub preview, Acme' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(signOut).not.toHaveBeenCalled();
  });
});
