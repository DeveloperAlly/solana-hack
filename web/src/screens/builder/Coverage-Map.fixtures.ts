// Sample data for Coverage-Map. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Coverage-Map (note n-cov;
// all 17 rows as drawn; totals are counted by the component and match the canvas: JamJam E 0 · I 2 · M 15, film.fun
// E 8 · I 3 · M 6); issue #50; backend map §4, row "Coverage-Map". Statuses are sample data (note n-cov.3).
import type { CoverageState } from '../../ui/domain/BuilderCoverageBadge';
import type { CoverageData, CoverageRow } from './types';
import { jamjamBrand } from './shared.fixtures';

const DRAFTED = 'Drafted from answers; you confirm';
const LATER = 'Not asked; add later';

const row = (section: string, jam: [CoverageState, string], film: [CoverageState, string], gate?: string): CoverageRow => ({
  section,
  gate,
  cells: [{ state: jam[0], action: jam[1] }, { state: film[0], action: film[1] }],
});

export const coverageData: CoverageData = {
  brand: jamjamBrand,
  caption: 'Coverage by section. JamJam: zero public presence. film.fun: public site and posts.',
  brands: ['JamJam', 'film.fun'],
  rows: [
    row('Identity', ['I', 'Confirm draft'], ['E', 'Confirm only']),
    row('Purpose', ['I', 'Confirm draft'], ['E', 'Confirm only'], 'Gate 1'),
    row('Beliefs / POV', ['M', 'Ask: step 2'], ['I', 'Confirm draft']),
    row('Values', ['M', DRAFTED], ['M', DRAFTED]),
    row('Positioning', ['M', 'Ask: step 4, Gate 2'], ['E', 'Confirm only'], 'Gate 2'),
    row('Value props', ['M', DRAFTED], ['E', 'Confirm only']),
    row('Audience', ['M', 'Ask: step 5'], ['E', 'Confirm only']),
    row('Messaging', ['M', DRAFTED], ['E', 'Confirm only']),
    row('Voice attributes', ['M', 'Ask: step 6, Gate 3'], ['I', 'Confirm draft'], 'Gate 3'),
    row('Tone presets', ['M', DRAFTED], ['M', DRAFTED]),
    row('Vocabulary', ['M', DRAFTED], ['I', 'Confirm draft']),
    row('Claims', ['M', 'Not asked; add on Claims'], ['E', 'Confirm only']),
    row('Visual kit', ['M', LATER], ['M', LATER]),
    row('Audio kit', ['M', LATER], ['M', LATER]),
    row('Behaviour', ['M', LATER], ['M', LATER]),
    row('Examples', ['M', DRAFTED], ['E', 'Confirm only']),
    row('Governance', ['M', LATER], ['M', LATER]),
  ],
};
