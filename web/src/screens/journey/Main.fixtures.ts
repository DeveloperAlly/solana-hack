/*
 * Sample data for Main (landing v3): canvas board Main (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Main),
 * issue #48, backend map §4 row "Main". Copy is the canvas text; bracketed text stays bracketed until #36 registers
 * JamJam's own kit v1 and launch post.
 */
import type { MainData } from './types';
import { facts } from './journey.fixtures';

export const mainFixture: MainData = {
  chip: 'Brand kit and first post · every fact sourced',
  headline: "Your brand, built from what you've already said. Proven on every post.",
  intro:
    'Paste your site. We read it and show every fact with the line we found it on. Then we draft your brand kit and your first post in your voice. You approve each one, and anyone can check it\'s really you.',
  siteDefault: '',
  sitePlaceholder: 'jamjam.tech',
  example: {
    title: 'Real example: JamJam built itself',
    kitChip: 'Kit v1 · registered',
    facts: [
      { fact: facts.purpose },
      { fact: { id: 'voice-approved', section: 'Voice', status: 'found', statement: 'Plain, direct, no hype. [voice line from kit v1]' }, decision: 'Approved' },
    ],
    post: {
      title: 'First post, from kit v1',
      text: "[JamJam's launch post, as registered on #36]",
      badges: [{ label: 'Official', solid: true }, { label: 'Claims backed' }, { label: 'Slop check passed' }],
    },
  },
  howSteps: [
    { title: 'We read your site', body: 'Facts appear with the exact line we found them on.' },
    { title: 'You confirm', body: "Accept or fix what we found. We only ask what's missing." },
    { title: 'Pick your voice', body: 'Choose the paragraph that sounds like you. Twice.' },
    { title: 'Approve your kit', body: 'Purpose, positioning and voice, each with its sources.' },
    { title: 'Post, provably', body: 'Your first post, every claim backed, checkable by anyone.' },
  ],
  features: [
    {
      title: 'Every fact has a receipt',
      body: 'A fact is kept only if its line is on your page. Click any fact to see where it came from.',
      quote: 'We read your site and links first and show what we found beside each question.',
    },
    { title: 'Nothing goes out without you', body: 'Draft posts in your voice. Each one is checked for AI slop and fit before you see it. Nothing goes out until you approve it.' },
    { title: "Anyone can check it's you", body: "Approved kits and posts are registered on Solana. Paste any post into Check a post to see if it's official." },
  ],
  builtInPublic: "Our own kit and posts are on the public ledger. [First users' quotes go here once we have them; nothing invented.]",
};

/** Empty: JamJam's kit is not registered yet (#36), so the example panel is hidden rather than faked (canvas note n-main 3). */
export const mainFixtureNoExample: MainData = { ...mainFixture, example: null };

/** Error: an invalid address carried into the field shows the inline error under it (canvas note n-main, STATES). */
export const mainFixtureInvalidUrl: MainData = { ...mainFixture, siteDefault: 'jamjam' };
