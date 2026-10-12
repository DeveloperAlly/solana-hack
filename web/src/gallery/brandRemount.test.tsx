// A brand switch remounts the routed screen, so transient selections never cross brands (Codex review on PR #79,
// thread 4249094547). Uses the real registry and the real Publish-Calendar screen.
import { describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { GalleryScreen } from './GalleryScreen';
import { selectBrand } from '../flows/brand/activeBrand';

vi.mock('../lib/supabase', () => ({ supabase: null }));

function open(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/screens/:artboard" element={<GalleryScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('brand switch on a routed screen', () => {
  it('a calendar slot selected for one brand is cleared on switching, and is never scheduled into the other brand', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/screens/Publish-Calendar']}>
        <Routes>
          <Route path="/screens/:artboard" element={<GalleryScreen />} />
        </Routes>
      </MemoryRouter>,
    );
    await user.click(screen.getAllByRole('button', { name: '[open slot]' })[0]);
    await user.click(screen.getByRole('radio', { name: '[approved post 2]' }));
    expect(screen.getByRole('button', { name: 'Schedule here' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'aDNA, switch brand' }));
    await user.click(screen.getByRole('menuitemradio', { name: /GamersLab/ }));

    expect(screen.queryByRole('button', { name: 'Schedule here' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '[open slot]' })).toHaveLength(2);
    expect(screen.queryByText('Scheduled this session')).not.toBeInTheDocument();
  });

  it('a brand added on Brand-Switcher and selected is the brand Superhub shows, never another (Codex review on PR #103)', async () => {
    const user = userEvent.setup();
    open('/screens/Brand-Switcher');
    await user.click(screen.getByRole('button', { name: 'Add a brand' }));
    await user.type(screen.getByLabelText('Brand name'), 'Acme Tools');
    await user.type(screen.getByLabelText(/Website domain/), 'acme.example');
    await user.click(screen.getByRole('button', { name: 'Add brand' }));
    await user.click(screen.getByRole('button', { name: 'Switch to Acme Tools' }));
    cleanup();
    open('/screens/Content-Dashboard');
    expect(screen.getByRole('button', { name: 'Acme Tools, switch brand' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^JamJam, switch brand/ })).not.toBeInTheDocument();
  });

  it('an active brand the catalog does not hold shows Brand not found, not another brand', () => {
    open('/screens/Content-Dashboard');
    act(() => selectBrand('brand-unknown'));
    expect(screen.getByRole('heading', { level: 1, name: 'Brand not found' })).toBeInTheDocument();
  });
});
