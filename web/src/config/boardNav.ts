// Where a board sits in the one navigation (config/nav.ts; ADR-012: every screen has exactly one home). The stage is
// the board's home, from its canvas page (`homeForArtboard`); the tab is the stage tab that opens this board, or the
// tab of the board it belongs under (Platform-Detail under Platforms). Page frames read this; none hard-codes a stage.
// Proposed for nav.ts itself (PR #102 note to the loop-core branch); kept beside it until then.
import type { ArtboardName } from './artboards';
import { homeForArtboard, stageById, type StageId } from './nav';

export interface BoardNav {
  stage: StageId;
  /** The current tab id, when the board (or `under`) is one of the stage's tabs. */
  tab?: string;
}

/** The stage and tab a signed-in board shows as current. Throws for a board with no stage (first run, archive). */
export function navForArtboard(artboard: ArtboardName, under: ArtboardName = artboard): BoardNav {
  const home = homeForArtboard(artboard);
  if (!home || home === 'first-run') throw new Error(`boardNav: ${artboard} has no stage (home ${home ?? 'none'})`);
  return { stage: home, tab: stageById(home).tabs.find((t) => t.artboard === under)?.id };
}
