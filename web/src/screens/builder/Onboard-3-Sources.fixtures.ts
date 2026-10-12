// Sample data for Onboard-3-Sources. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Onboard-3-Sources
// (note n-ob3); issue #50; backend map §4, row "Onboard-3-Sources". Bracketed values stay bracketed.
import type { SourcesData } from './types';
import { jamjamBrand } from './shared.fixtures';

export const sourcesData: SourcesData = {
  brand: jamjamBrand,
  links: [
    { id: 'site', name: 'jamjam.tech', status: 'From step 1', tone: 'done' },
    { id: 'press', name: '[2023 press or docs links]', status: 'From step 1', tone: 'done' },
  ],
  accounts: [
    { id: 'x', name: 'X', status: 'Reading post history: coming soon', tone: 'done' },
    { id: 'linkedin', name: 'LinkedIn', status: 'Reading post history: coming soon', tone: 'done' },
  ],
};
