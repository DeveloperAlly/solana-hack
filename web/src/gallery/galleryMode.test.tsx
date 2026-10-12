import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { useGalleryMode } from '../ui/hooks/galleryMode';
import { AppShell } from '../ui/shells/AppShell';
import type { ScreenEntry } from '../screens/registry-types';
import { GalleryScreen } from './GalleryScreen';

// Every Supabase auth method is a spy, so the test proves the gallery reaches none of them.
const auth = vi.hoisted(() => ({ signOut: vi.fn(), getSession: vi.fn(), signInWithOtp: vi.fn(), verifyOtp: vi.fn(), onAuthStateChange: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { auth } }));

function ModeProbe() {
  return <p>{useGalleryMode() ? 'gallery mode' : 'live mode'}</p>;
}

// Probe artboards are test-only names, not canvas boards.
const entries = [
  { artboard: 'Probe', page: 'public', title: 'Probe', tag: 'HACKATHON', states: ['success'], render: () => <ModeProbe /> },
  { artboard: 'Hub-Frame', page: 'public', title: 'Hub frame', tag: 'HACKATHON', states: ['success'], render: () => <AppShell>hub body</AppShell> },
] as unknown as ScreenEntry[];
// Read lazily: vi.mock is hoisted above `entries`.
vi.mock('./registry', () => ({ findScreen: (a?: string) => entries.find((e) => e.artboard === a) }));

function at(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/screens/:artboard" element={<GalleryScreen />} />
        <Route path="/" element={<p>landing</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('gallery mode', () => {
  it('GalleryScreen renders every screen in gallery mode', () => {
    at('/screens/Probe');
    expect(screen.getByText('gallery mode')).toBeInTheDocument();
  });

  it('Sign out in a gallery screen calls no Supabase method and stays put', async () => {
    at('/screens/Hub-Frame');
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    for (const fn of Object.values(auth)) expect(fn).not.toHaveBeenCalled();
    expect(screen.getByText('hub body')).toBeInTheDocument();
  });

  it('outside the gallery the mode is off', () => {
    render(<ModeProbe />);
    expect(screen.getByText('live mode')).toBeInTheDocument();
  });
});
