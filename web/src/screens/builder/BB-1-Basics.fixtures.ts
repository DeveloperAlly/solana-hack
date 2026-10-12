// Sample data for BB-1-Basics. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board BB-1-Basics (note n-bb1);
// issue #50; backend map §4, row "BB-1-Basics". Bracketed values stay bracketed. The error fixture adds one line that is not
// a link, to show the inline error the note asks for.
import type { BasicsData } from './types';
import { jamjamBrand } from './shared.fixtures';

export const basicsData: BasicsData = {
  brand: jamjamBrand,
  description: 'Build your brand, run it, prove it.',
  type: 'company',
  typeOptions: [
    { value: 'company', title: 'Company', meta: 'A product or organisation' },
    { value: 'person', title: 'Person', meta: 'A personal brand' },
    { value: 'founder', title: 'Founder-linked', meta: "A company plus its founder's profile" },
  ],
  links: 'jamjam.tech\n[2023 press or docs links]',
  goal: '[Owner answer]',
  channel: 'X',
  channels: ['X', 'LinkedIn', 'Blog or newsletter', 'Instagram', 'TikTok', 'Other'],
};

export const basicsErrorData: BasicsData = { ...basicsData, links: `${basicsData.links}\njamjam tech` };
