import type { ReactElement } from 'react';
import type { RouteTag } from '../config/routes';
import type { ScreenState } from '../ui/composites/DemoStateSwitcher';
import type { ArtboardName } from '../config/artboards';

/**
 * Canvas pages, in canvas order, from the wireframe canvas (canvas.json `pages`; canvas link in issue #45).
 * The Archive page ("licensee") is not built (issue #45, owner decision 2026-10-12), so it is not listed.
 * `issue` is the sub-issue that builds the page's screens (issue #45, "Sub-issues").
 */
export const canvasPages = [
  { id: 'journey', name: 'Journey (v3): first run', issue: 48 },
  { id: 'public', name: 'Verify + ledger', issue: 49 },
  { id: 'brand', name: 'Brand Builder', issue: 50 },
  { id: 'soon', name: 'Coming soon (drawn, not built)', issue: 51 },
  { id: 'hub', name: 'Superhub (v2)', issue: 52 },
  { id: 'ambassador', name: 'Ambassador', issue: 53 },
] as const;

export type CanvasPageId = (typeof canvasPages)[number]['id'];

/** One canvas artboard, built as a screen and registered in its page's `src/screens/<folder>/registry.ts`. */
export interface ScreenEntry {
  /** Canvas artboard name: the file name without `.dc.html`, e.g. "Verify-2-NoMatch". It is the gallery URL. */
  artboard: ArtboardName;
  page: CanvasPageId;
  /** Canvas title without the tag prefix, e.g. "Verify: not found". */
  title: string;
  /** Canvas tag, mapped to the route tags in config/routes.ts. */
  tag: RouteTag;
  /** States this artboard has on the canvas (its notes); the first is the default. */
  states: readonly ScreenState[];
  /** Renders the screen with fixture data for a state. Must not touch the network. */
  render: (state: ScreenState) => ReactElement;
}
