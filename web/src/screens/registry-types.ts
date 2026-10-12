import type { ReactElement } from 'react';
import type { RouteTag } from '../config/routes';
import type { ScreenState } from '../ui/composites/DemoStateSwitcher';
import type { ArtboardName } from '../config/artboards';
import type { ShellId } from '../config/nav';

/**
 * Canvas pages, in canvas order, from the wireframe canvas v22 (canvas.json `pages`, version 1791817328-4e15; canvas
 * link in issue #45). v21 and later organise the pages by the loop of ADR-012 (PR #86): Start here, Journey, the six steps,
 * then the utilities. The Archive page ("licensee") holds boards that are not in the product (issue #45, owner
 * decision 2026-10-12); its boards are not artboards (config/artboards.ts). `issue` is where the page's screens are
 * tracked (the issue #45 sub-issues; #86 for the loop boards; #82 for the Distribute boards it added).
 */
export const canvasPages = [
  { id: 'loop', name: 'Start here: the loop (v4)', issue: 86 },
  { id: 'journey', name: 'Journey (v3): first run', issue: 48 },
  { id: 'brand', name: '1 · Brand: build your brand and voice', issue: 50 },
  { id: 'create', name: '2 · Create: content in your voice', issue: 52 },
  { id: 'distribute', name: '3 · Distribute everywhere', issue: 82 },
  { id: 'public', name: '4 · Verify anywhere', issue: 49 },
  { id: 'grow', name: '5 · Grow your reach', issue: 53 },
  { id: 'learn', name: '6 · Learn from what works', issue: 52 },
  { id: 'utilities', name: 'Inbox, settings and plan', issue: 51 },
  { id: 'licensee', name: 'Archive (not in product)', issue: 45 },
] as const;

export type CanvasPageId = (typeof canvasPages)[number]['id'];

/** One canvas artboard, built as a screen and registered in its page's `src/screens/<folder>/registry.ts`. */
export interface ScreenEntry {
  /** Canvas artboard name: the file name without `.dc.html`, e.g. "Verify-2-NoMatch". It is the gallery URL. */
  artboard: ArtboardName;
  /** The board's canvas page. The screen's home is derived from it (config/nav.ts `homeForPage`), never written here. */
  page: CanvasPageId;
  /** Canvas title without the tag prefix, e.g. "Verify: not found". */
  title: string;
  /** Canvas tag, mapped to the route tags in config/routes.ts. */
  tag: RouteTag;
  /** States this artboard has on the canvas (its notes); the first is the default. */
  states: readonly ScreenState[];
  /**
   * Who the screen is for (ADR-012 shells by role). Leave it out when the screen renders its frame: the frame says
   * (AppShell and AppFrame mark `app` or `ambassador`, PublicShell `public`). Set it only when the frame cannot.
   */
  shell?: ShellId;
  /** Renders the screen with fixture data for a state. Must not touch the network. */
  render: (state: ScreenState) => ReactElement;
}
