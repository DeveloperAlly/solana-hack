// Sample data for BB-4-Alternatives. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-4-Alternatives
// (note n-bb4); issue #50; backend map §4, row "BB-2 to BB-6". Options A to C are the canvas text; the second set (D to F)
// is the "Show three different options" result, bracketed like the canvas because it is not drawn.
import type { AlternativesData, ChoiceCardOption } from './types';
import { jamjamBrand } from './shared.fixtures';

const option = (letter: string, text: string, sources: number): ChoiceCardOption => ({
  value: letter,
  title: `Option ${letter}`,
  body: text,
  meta: `Against: [category alternative] · Sources: [${sources}]`,
});

export const alternativesData: AlternativesData = {
  brand: jamjamBrand,
  questions: [
    { id: 'alt', label: "What would people use if you didn't exist?", value: '[Owner answer]' },
    { id: 'edge', label: "What can you do that they can't?", value: '[Owner answer]' },
  ],
  optionSets: [
    [
      option('A', '[Positioning option A, e.g. "the brand hub that proves what\'s official"]', 2),
      option('B', '[Positioning option B, e.g. "pay your community per verified post"]', 2),
      option('C', '[Positioning option C, e.g. "your brand kit, with receipts"]', 3),
    ],
    [option('D', '[Positioning option D]', 2), option('E', '[Positioning option E]', 2), option('F', '[Positioning option F]', 2)],
  ],
  sourcesNote: 'Drafted from your answers and public competitor pages [sources listed per option]',
};
