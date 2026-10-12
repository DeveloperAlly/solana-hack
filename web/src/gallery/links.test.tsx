import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { allScreens } from './registry';
import { artboardPages, artboards, isArtboardName } from '../config/artboards';
import { GalleryModeContext } from '../ui/hooks/galleryMode';

// Link integrity (issue #46; Codex reviews on PR #79 and PR #80). Link targets are typed: screenPath, useScreenHref and
// ScreenLink take an ArtboardName (config/artboards.ts), so a misspelled or missing board fails typecheck. These
// tests cover what types cannot:
// 1. No raw "/screens/..." strings in screens or ui: every link goes through the typed helpers.
// 2. Every link any registered screen renders, in any state, targets a registered artboard (merge order).
// 3. Every registered artboard is a canvas board.
// 4. Canvas boards not registered yet are listed as todo, a list that shrinks to zero as pages land.

vi.mock('../lib/supabase', () => ({ supabase: null }));
beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('the gallery must not call fetch')))));
afterEach(() => vi.unstubAllGlobals());

const registered = new Set<string>(allScreens.map((s) => s.artboard));

const sources = {
  ...import.meta.glob<string>('../screens/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob<string>('../ui/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }),
};
const RAW_SCREEN_PATH = /["'`]\/screens\//;

function artboardOf(href: string): string | null {
  const m = /^\/screens\/([^/?#]+)/.exec(href);
  return m ? decodeURIComponent(m[1]) : null;
}

describe('links between screens', () => {
  it('no screen or component builds a /screens/ path by hand (use screenPath, useScreenHref or ScreenLink)', () => {
    const offenders = Object.entries(sources)
      .filter(([file]) => !/\.test\.tsx?$/.test(file))
      .flatMap(([file, text]) => text.split('\n').map((line, i) => ({ file, line: i + 1, text: line })))
      .filter((l) => RAW_SCREEN_PATH.test(l.text))
      .map((l) => `${l.file}:${l.line}: ${l.text.trim()}`);
    expect(offenders).toEqual([]);
  });

  it('every /screens/<artboard> link rendered by any screen, in any state, is registered', () => {
    const missing: string[] = [];
    for (const entry of allScreens) {
      for (const state of entry.states) {
        const { container } = render(
          <MemoryRouter initialEntries={[`/screens/${entry.artboard}`]}>
            <GalleryModeContext.Provider value={true}>{entry.render(state)}</GalleryModeContext.Provider>
          </MemoryRouter>,
        );
        for (const a of container.querySelectorAll('a[href]')) {
          const target = artboardOf(a.getAttribute('href') ?? '');
          if (target && !registered.has(target)) missing.push(`${entry.artboard} (${state}) -> ${target}`);
        }
        cleanup();
      }
    }
    expect(missing).toEqual([]);
  });

  it('every registered artboard is a canvas board', () => {
    expect([...registered].filter((a) => !isArtboardName(a))).toEqual([]);
  });

  it('every registry entry names the canvas page its board is on (config/artboards.ts, generated from the canvas)', () => {
    const wrong = allScreens.filter((s) => s.page !== artboardPages[s.artboard]).map((s) => `${s.artboard}: ${s.page}, canvas ${artboardPages[s.artboard]}`);
    expect(wrong).toEqual([]);
  });
});

describe('canvas boards not registered yet (pending; shrinks to zero)', () => {
  for (const name of artboards.filter((a) => !registered.has(a))) it.todo(name);
});
