// Sample data for BB-Gate2-Positioning. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
// BB-Gate2-Positioning (note n-g2); issue #50; backend map §4, row "Gate 1, Gate 2, Gate 3". Bracketed values stay bracketed.
// {brand} is filled with the brand name entered in the flow (JamJam on the canvas).
import type { GatePositioningData } from './types';
import { jamjamBrand } from './shared.fixtures';

export const gatePositioningData: GatePositioningData = {
  brand: jamjamBrand,
  draft: 'For [audience] who [need], {brand} is [category] that [benefit]. Unlike [alternative], it [difference].',
  alternative: '[From your step 4 answer]',
  edge: '[From your step 4 answer]',
  sourcesNote: 'Sources: your step 4 answers (owner answer, [date]) · [public competitor pages, linked]',
};
