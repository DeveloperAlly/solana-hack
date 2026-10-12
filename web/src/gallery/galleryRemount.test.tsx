import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import type { ScreenState } from '../ui/composites/DemoStateSwitcher';

// A screen that copies its fixture into local state on mount, the pattern Codex flagged on PR #73
// (Onboard-3-Sources, Onboard-3b-Profiling, BB-1-Basics).
function Initialised({ label }: { label: string }) {
  const [value] = useState(label);
  return <main><p>shown: {value}</p></main>;
}

vi.mock('./registry', () => {
  const entry = (artboard: string, fixture: (s: ScreenState) => string) => ({
    artboard,
    page: 'brand',
    title: artboard,
    tag: 'HACKATHON',
    states: ['success', 'empty'] as ScreenState[],
    render: (s: ScreenState) => <Initialised label={fixture(s)} />,
  });
  const screens = [
    entry('Variant-A', (s) => `A-${s}`),
    entry('Variant-B', (s) => `B-${s}`),
  ];
  return { allScreens: screens, findScreen: (a: string | undefined) => screens.find((s) => s.artboard === a) };
});

const { GalleryScreen } = await import('./GalleryScreen');

function at(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/screens/:artboard" element={<GalleryScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('gallery remounts a screen when its artboard or state changes', () => {
  it('a state switch shows the new fixture, not the one copied into state on first mount', async () => {
    at('/screens/Variant-A?state=success');
    expect(screen.getByText('shown: A-success')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: /empty/i }));
    expect(screen.getByText('shown: A-empty')).toBeInTheDocument();
  });

  it('moving between two artboards rendered by the same component does not keep the first one\'s local state', async () => {
    render(
      <MemoryRouter initialEntries={['/screens/Variant-A?state=success']}>
        <Link to="/screens/Variant-B?state=success">go to B</Link>
        <Routes>
          <Route path="/screens/:artboard" element={<GalleryScreen />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('shown: A-success')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'go to B' }));
    expect(screen.getByText('shown: B-success')).toBeInTheDocument();
  });
});
