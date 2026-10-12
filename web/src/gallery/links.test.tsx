import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { allScreens } from './registry';
import { GalleryModeContext } from '../ui/hooks/galleryMode';

// Link integrity (issue #46; Codex review on PR #79): every link between screens must target a registered artboard.
// This enforces merge order: a page cannot ship links to screens that are not in the gallery yet.
// Two passes, because neither alone sees every link:
// 1. Source scan: every artboard named to ScreenLink, screenPath or useScreenHref, and every literal "/screens/<X>",
//    in src/screens and src/ui (links behind menus or states that no fixture opens are still found).
// 2. Render crawl: every registered screen in every state, collecting each rendered "/screens/<X>" href (links built
//    by page helpers such as public-next/paths.ts are found).

vi.mock('../lib/supabase', () => ({ supabase: null }));
beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('the gallery must not call fetch')))));
afterEach(() => vi.unstubAllGlobals());

const registered = new Set(allScreens.map((s) => s.artboard));

const sources = {
  ...import.meta.glob<string>('../screens/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob<string>('../ui/**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }),
};

const ARTBOARD = String.raw`([A-Za-z0-9][\w.-]*)`;
const patterns = [
  new RegExp(String.raw`<ScreenLink\b[^>]*?\bartboard=\{?\s*["'\x60]` + ARTBOARD, 'g'),
  new RegExp(String.raw`\bscreenPath\(\s*["'\x60]` + ARTBOARD, 'g'),
  new RegExp(String.raw`\buseScreenHref\(\)\(\s*["'\x60]` + ARTBOARD, 'g'),
  new RegExp(String.raw`["'\x60]/screens/` + ARTBOARD, 'g'),
];

/** Artboards named as link targets in source, with the file that names them. */
function linkTargetsInSource(files: Record<string, string>): { artboard: string; file: string }[] {
  const found: { artboard: string; file: string }[] = [];
  for (const [file, text] of Object.entries(files)) {
    if (/\.test\.tsx?$/.test(file)) continue;
    for (const re of patterns) for (const m of text.matchAll(re)) found.push({ artboard: m[1], file });
  }
  return found;
}

function artboardOf(href: string): string | null {
  const path = href.split(/[?#]/)[0];
  const m = /^\/screens\/([^/]+)$/.exec(path);
  return m ? decodeURIComponent(m[1]) : null;
}

describe('links between screens', () => {
  it('the source scan finds each pattern (self-check)', () => {
    const sample = {
      'a.tsx': `<ScreenLink artboard="A-1" state="empty">x</ScreenLink> screenPath('B-2') useScreenHref()("C-3") const p = '/screens/D-4?x=1';`,
      'a.test.tsx': `<ScreenLink artboard="Ignored">`,
    };
    expect(linkTargetsInSource(sample).map((t) => t.artboard)).toEqual(['A-1', 'B-2', 'C-3', 'D-4']);
  });

  it('every artboard named in source as a link target is registered', () => {
    const missing = linkTargetsInSource(sources).filter((t) => !registered.has(t.artboard));
    expect(missing.map((t) => `${t.file} -> ${t.artboard}`)).toEqual([]);
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
});
