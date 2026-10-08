import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithRouter } from '../../test/render';
import { AppShell } from './AppShell';
import { hubNav } from '../../config/routes';

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
