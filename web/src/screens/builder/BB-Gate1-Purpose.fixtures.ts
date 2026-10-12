// Sample data for BB-Gate1-Purpose. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-Gate1-Purpose
// (note n-g1); issue #50; backend map §4, row "Gate 1, Gate 2, Gate 3". The canvas draws one draft; the "Try another draft"
// and "Make it shorter" results are not drawn, so they stay bracketed.
import type { GatePurposeData } from './types';
import { jamjamBrand } from './shared.fixtures';

export const gatePurposeData: GatePurposeData = {
  brand: jamjamBrand,
  draft: '[Purpose drafted from your answers, e.g. "So that brands can show up consistently, credit the people who speak for them, and prove what\'s official."]',
  alternatives: ['[Another purpose draft from the same answers]'],
  shorter: '[A shorter version of the purpose draft]',
  draftMeta: 'Drafted from 4 sources',
  basedOn: [
    'Your "why it matters" answer · owner answer, [date]',
    'Your origin answers · owner answer, [date]',
    'jamjam.tech (2023 launch) · source, confirmed',
  ],
};
