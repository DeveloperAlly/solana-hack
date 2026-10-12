// Sample data for BB-3-GoldenCircle. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-3-GoldenCircle
// (note n-bb3); issue #50; backend map §4, row "BB-2 to BB-6". Bracketed values stay bracketed.
import type { GoldenCircleData } from './types';
import { jamjamBrand } from './shared.fixtures';

export const goldenCircleData: GoldenCircleData = {
  brand: jamjamBrand,
  questions: [
    { id: 'what', label: 'What do you do?', value: '[Owner answer]', rows: 5 },
    { id: 'how', label: 'How do you do it differently?', value: '[Owner answer]', rows: 5 },
    { id: 'why', label: 'Why does it matter?', value: '[Owner answer]', rows: 5, hint: 'The hardest one. It becomes your purpose.' },
  ],
};
