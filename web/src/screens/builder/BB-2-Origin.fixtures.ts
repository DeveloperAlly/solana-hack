// Sample data for BB-2-Origin. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-2-Origin (note n-bb2;
// the 2023 lineage line comes from existing docs, n-bb2.3); issue #50; backend map §4, row "BB-2 to BB-6".
import type { OriginData } from './types';
import { jamjamBrand } from './shared.fixtures';

export const originData: OriginData = {
  brand: jamjamBrand,
  fact: { source: 'jamjam.tech', text: 'JamJam first launched in 2023: artists opted in and were paid each time someone generated in their style.' },
  answers: [
    { id: 'why', label: 'Why does it exist?', value: '[Owner answer]' },
    { id: 'broken', label: 'What was broken that you set out to fix?', value: '[Owner answer]' },
    { id: 'proof', label: "What's your first win or proof point so far?", value: '[Owner answer, or "none yet"]', rows: 2, hint: 'Saved as evidence: "owner answer, [date]".' },
  ],
};
