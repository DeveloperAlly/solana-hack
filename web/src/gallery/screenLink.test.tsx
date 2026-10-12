import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link as RouterLink, MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { expectNoAxeViolations } from '../test/axe';
import { screenPath } from './screenPath';
import { ScreenLink } from './ScreenLink';
import { GalleryScreen } from './GalleryScreen';
import { allScreens } from './registry';

vi.mock('../lib/supabase', () => ({ supabase: null }));
afterEach(() => document.documentElement.setAttribute('data-theme', 'wireframe'));

describe('screenPath', () => {
  it('keeps the theme, drops the other screen state, and sets a state when asked', () => {
    const current = new URLSearchParams('theme=wireframe-dark&state=error');
    expect(screenPath('Verify-1-Match', undefined, current)).toBe('/screens/Verify-1-Match?theme=wireframe-dark');
    expect(screenPath('Verify-1-Match', 'empty', current)).toBe('/screens/Verify-1-Match?theme=wireframe-dark&state=empty');
    expect(screenPath('Ledger')).toBe('/screens/Ledger');
  });
});

function BareLink({ to }: { to: string }) {
  return <RouterLink to={to}>Bare link</RouterLink>;
}

function Where() {
  const loc = useLocation();
  return <p data-testid="where">{loc.pathname + loc.search}</p>;
}

describe('ScreenLink', () => {
  it('a link from one screen to another keeps ?theme= (Codex review on PR #68)', async () => {
    const [from, to] = [allScreens[0].artboard, allScreens[allScreens.length - 1].artboard];
    const { container } = render(
      <MemoryRouter initialEntries={[`/screens/${from}?theme=wireframe-dark`]}>
        <Routes>
          <Route path="/screens/:artboard" element={<><GalleryScreen /><ScreenLink artboard={to}>Next screen</ScreenLink><Where /></>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(document.documentElement).toHaveAttribute('data-theme', 'wireframe-dark');
    await userEvent.click(screen.getByRole('link', { name: 'Next screen' }));
    expect(screen.getByTestId('where')).toHaveTextContent(`/screens/${to}?theme=wireframe-dark`);
    expect(document.documentElement).toHaveAttribute('data-theme', 'wireframe-dark');
    await expectNoAxeViolations(container);
  });
  it('a bare /screens/<Artboard> link inside a screen also keeps the theme', async () => {
    const [from, to] = [allScreens[0].artboard, allScreens[allScreens.length - 1].artboard];
    render(
      <MemoryRouter initialEntries={[`/screens/${from}?theme=wireframe-dark`]}>
        <Routes>
          <Route path="/screens/:artboard" element={<><GalleryScreen /><Where /></>} />
        </Routes>
        <BareLink to={`/screens/${to}`} />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('link', { name: 'Bare link' }));
    expect(screen.getByTestId('where')).toHaveTextContent(`/screens/${to}?theme=wireframe-dark`);
    expect(document.documentElement).toHaveAttribute('data-theme', 'wireframe-dark');
  });
  it('renders as a button-styled link with a state', () => {
    render(
      <MemoryRouter initialEntries={['/screens/A?theme=wireframe-dark']}>
        <ScreenLink artboard="Ledger" state="empty" as="button" variant="secondary">Open ledger</ScreenLink>
      </MemoryRouter>,
    );
    const a = screen.getByRole('link', { name: 'Open ledger' });
    expect(a).toHaveAttribute('href', '/screens/Ledger?theme=wireframe-dark&state=empty');
    expect(a).toHaveClass('secondary');
  });
});
