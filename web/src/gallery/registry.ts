import { canvasPages, type ScreenEntry } from '../screens/registry-types';

// Every page registers its screens in its own src/screens/<folder>/registry.ts, collected here at build time,
// so page PRs never edit a shared file (issue #46).
const modules = import.meta.glob<{ screens: ScreenEntry[] }>('../screens/*/registry.ts', { eager: true });

const pageOrder: string[] = canvasPages.map((p) => p.id);

/** Every registered screen, in canvas page order, then by artboard name. */
export const allScreens: ScreenEntry[] = Object.values(modules)
  .flatMap((m) => m.screens)
  .sort((a, b) => pageOrder.indexOf(a.page) - pageOrder.indexOf(b.page) || a.artboard.localeCompare(b.artboard));

// Artboard names are the gallery URLs, so they must be unique; fail loudly at load, not with a wrong screen.
const seen = new Set<string>();
for (const s of allScreens) {
  if (seen.has(s.artboard)) throw new Error(`gallery: artboard ${s.artboard} is registered twice`);
  seen.add(s.artboard);
}

export function findScreen(artboard: string | undefined): ScreenEntry | undefined {
  return allScreens.find((s) => s.artboard === artboard);
}
