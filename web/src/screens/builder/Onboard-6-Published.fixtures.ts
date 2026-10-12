// Sample data for Onboard-6-Published. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
// Onboard-6-Published (note n-ob6); issue #50; backend map §4, row "Onboard-6-Published, Kit-RegisterFailed". Every
// figure the canvas brackets stays bracketed.
import type { PublishedData } from './types';
import { jamjamBrand } from './shared.fixtures';

export const publishedData: PublishedData = {
  brand: jamjamBrand,
  status: 'registered',
  version: 'v1',
  hash: '[sha256 of kit v1]',
  approvedAt: '[date, time]',
  sections: '3 gates approved · [n] confirmed · [n] missing',
  /** Not a real signature, so null: the receipt link shows the bracketed placeholder instead of a broken explorer link. */
  tx: null,
};
