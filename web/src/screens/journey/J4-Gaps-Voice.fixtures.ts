/*
 * Sample data for J4-Gaps-Voice: canvas board J4-Gaps-Voice (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * J4-Gaps-Voice) and its note n-j4-gaps-voice, issue #48, backend map §4 row "BB-2 to BB-6". Round 1 paragraphs are the
 * board's; the board does not draw round 2, so its paragraphs stay bracketed placeholders.
 */
import type { GapsVoiceData } from './types';

const roundTwo = (letter: string) => ({ value: `r2-${letter.toLowerCase()}`, title: letter, tag: '[narrowed]', body: `[Round 2 paragraph ${letter}, written around your round 1 pick]` });

export const gapsVoiceFixture: GapsVoiceData = {
  brandName: 'JamJam',
  alternatives: {
    question: 'What do people use instead of JamJam today?',
    hint: 'Alternatives we found people compare against. Pick, edit or add your own.',
    options: ['Pressmaster', 'Google Pomelli', 'Canva Brand Kit'],
    selected: ['Pressmaster'],
    source: 'Source: competitor research (research 10, segments A and B), each with its link. Delivered by H6 (#35).',
  },
  edgeQuestion: 'What can only you do?',
  originQuestion: 'Why did you start it?',
  originNote: 'Saved as evidence: "owner answer, [date]".',
  voice: {
    intro: 'Three paragraphs written from your site at different settings. Round 2 narrows around your pick.',
    defaultPick: 'b',
    rounds: [
      [
        { value: 'a', title: 'A', tag: 'Plainspoken', body: "You've already said who you are. On your site, in your docs, in old posts. JamJam reads it, shows you where each line came from, and turns it into a kit you approve." },
        { value: 'b', title: 'B', tag: 'Candid founder', body: "I built JamJam because every brand tool asked me questions my website already answered. So it reads first, asks second, and shows its working. You sign off. That's the deal." },
        { value: 'c', title: 'C', tag: 'Friendly', body: "Let's skip the blank form. Paste your site and we'll pull out what makes you, you, with the receipts, so you can spend your time on the posts, not the paperwork." },
      ],
      [roundTwo('A'), roundTwo('B'), roundTwo('C')],
    ],
  },
};
