import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { expectNoAxeViolations } from '../test/axe';
import { GalleryIndex, GalleryScreen } from './Gallery';
import { allScreens } from './registry';
import { themeNames } from '../tokens/tokens';
import { examples } from '../system/Workbench';
import { renderWithRouter } from '../test/render';

// The gallery must never touch the network (issue #46): fetch throws, and every test asserts it was never called.
let fetchSpy: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchSpy = vi.fn(() => { throw new Error('the gallery must not call fetch'); });
  vi.stubGlobal('fetch', fetchSpy);
});
afterEach(() => {
  expect(fetchSpy).toHaveBeenCalledTimes(0);
  vi.unstubAllGlobals();
  document.documentElement.setAttribute('data-theme', 'wireframe');
});
vi.mock('../lib/supabase', () => ({ supabase: null }));

function at(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/screens" element={<GalleryIndex />} />
        <Route path="/screens/:artboard" element={<GalleryScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('/screens gallery', () => {
  it('has at least the sample screen registered, each artboard once', () => {
    expect(allScreens.map((s) => s.artboard)).toContain('Verify-2-NoMatch');
    expect(new Set(allScreens.map((s) => s.artboard)).size).toBe(allScreens.length);
  });

  it('index lists screens grouped by canvas page, with no fetch', async () => {
    const { container } = at('/screens');
    expect(screen.getByRole('heading', { level: 1, name: 'Screens' })).toBeInTheDocument();
    const page = screen.getByRole('region', { name: '4 · Verify anywhere' });
    expect(within(page).getByRole('link', { name: 'Verify-2-NoMatch' })).toHaveAttribute('href', '/screens/Verify-2-NoMatch');
    await expectNoAxeViolations(container);
  });

  it('keeps ?theme= on links and applies it to the document', () => {
    at('/screens?theme=wireframe-dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'wireframe-dark');
    expect(screen.getByRole('link', { name: 'Verify-2-NoMatch' })).toHaveAttribute('href', '/screens/Verify-2-NoMatch?theme=wireframe-dark');
    expect(screen.getByRole('link', { name: 'wireframe-dark' })).toHaveAttribute('aria-current', 'true');
  });

  it('ignores an unknown theme', () => {
    at('/screens?theme=nope');
    expect(document.documentElement).toHaveAttribute('data-theme', 'wireframe');
  });

  it('says so for an unknown artboard', () => {
    at('/screens/Nope');
    expect(screen.getByRole('heading', { name: 'No such screen' })).toBeInTheDocument();
  });

  // Every registered screen, in every state it declares and every theme, renders with 0 fetch calls and 0 axe violations.
  const cases = allScreens.flatMap((s) => s.states.flatMap((state) => themeNames.map((theme) => [s.artboard, state, theme] as const)));
  it.each(cases)('%s renders state %s in theme %s', async (artboard, state, theme) => {
    const { container } = at(`/screens/${artboard}?state=${state}&theme=${theme}`);
    expect(document.documentElement).toHaveAttribute('data-theme', theme);
    const switcher = screen.getByRole('navigation', { name: 'Screen state' });
    expect(within(switcher).getByRole('link', { current: true })).toHaveAttribute('href', expect.stringContaining(`state=${state}`));
    expect(screen.getByRole('main')).toBeInTheDocument();
    // Fixture content is never shown as if it were real: the gallery frame carries a visible "Sample data" flag.
    expect(within(screen.getByRole('complementary', { name: 'Gallery controls' })).getByText('Sample data')).toBeVisible();
    await expectNoAxeViolations(container);
  });
});

describe('/system examples (import.meta.glob)', () => {
  it('collects every *.example.tsx', () => {
    const ids = examples.map((e) => e.id);
    for (const id of ['C5', 'C1', 'C3', 'C4', 'C8', 'C10', 'C11', 'C12', 'C16', 'P14', 'C23', 'C28', 'C29', 'L6', 'D48', 'D33', 'D56', 'D57', 'D58', 'P10']) expect(ids).toContain(id);
  });
  it.each(examples.map((e) => [`${e.id} ${e.name}`, e] as const))('%s renders with 0 axe violations', async (_name, ex) => {
    const Render = ex.render;
    const { container } = renderWithRouter(<main><h1>Workbench</h1><h2>Components</h2><h3>{ex.name}</h3><Render /></main>);
    await expectNoAxeViolations(container);
  });
});
