import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ConfirmData, EvidenceStatus, FactDecision, FactRecord, GapsVoiceData, JourneyCoverage, JourneyFact, JourneySource, ReadData, SourceStatus } from '../../worker/prefill/contract';
import type { GapsData } from '../../worker/prefill/journey';

// The Journey contract (issue #34; coordination comment on #38: the Journey screens in PR #75 are the shape this API
// serves). The objects below are the UI's own fixtures, copied verbatim from branch ui/48-journey at e4d945b:
// web/src/screens/journey/journey.fixtures.ts, J1-Read.fixtures.ts, J3-Confirm.fixtures.ts and J4-Gaps-Voice.fixtures.ts.
// They are typed with the Worker's types (worker/prefill/contract.ts), so `tsc --noEmit -p .` fails if the Worker's
// types stop accepting what the screens were built against, and the expectTypeOf checks pin each shape exactly. This
// catches drift on the Worker's side only: the UI types are not on this branch. Once #75 merges, these copies should
// become imports of the UI's fixtures and types, so a change on either side fails the same check.

const home = { label: 'jamjam.tech · home page', url: 'https://jamjam.tech' };
const how = { label: 'jamjam.tech · How it works', url: 'https://jamjam.tech/how-it-works' };

const facts = {
  positioning: { id: 'positioning', section: 'Positioning', status: 'found', statement: 'JamJam builds a brand kit, then drafts posts in that voice.', quote: 'Build your brand. Then start creating.', source: home },
  purpose: { id: 'purpose', section: 'Purpose', status: 'found', statement: 'Approved work is registered so anyone can check what came from the brand.', quote: 'Your approved kit and approved posts are registered on Solana, so anyone can check what really came from you.', source: home },
  messagingChecked: { id: 'messaging-checked', section: 'Messaging', status: 'found', statement: 'Every draft is checked, and a person approves before anything goes out.', quote: 'Draft posts in your voice. Each one is checked for AI slop and fit before you see it. Nothing goes out until you approve it.', source: how },
  messagingGates: { id: 'messaging-gates', section: 'Messaging', status: 'found', statement: 'Owners sign off purpose, positioning and voice, with sources.', quote: 'You sign off three things: purpose, positioning and voice. Every fact shows where it came from; anything we drafted waits for you.', source: how },
  voiceRead: { id: 'voice', section: 'Voice', status: 'partly', statement: "Plain, direct sentences; second person. We'll confirm with you." },
} satisfies Record<string, JourneyFact>;

const readFixture: ReadData = {
  site: 'jamjam.tech',
  sources: [
    { id: 'home', label: 'jamjam.tech', status: 'read', facts: 4 },
    { id: 'how', label: '/how-it-works', status: 'reading' },
    { id: 'verify', label: '/verify', status: 'queued' },
    { id: 'docs', label: 'docs.example.com', status: 'blocked', reason: 'its robots.txt says no' },
  ],
  facts: [facts.positioning, facts.purpose, facts.messagingChecked, facts.voiceRead],
  coverage: { found: 3, partly: 1, needsYou: 2, percent: 58 },
};
const readFixtureLoading: ReadData = {
  ...readFixture,
  sources: readFixture.sources.map((s) => ({ ...s, status: s.id === 'home' ? 'reading' : 'queued', facts: undefined, reason: undefined })),
  facts: [],
  coverage: { found: 0, partly: 0, needsYou: 6, percent: 0 },
};

const confirmFixture: ConfirmData = {
  facts: [
    { ...facts.positioning, section: 'Positioning · Gate 2' },
    { ...facts.purpose, section: 'Purpose · Gate 1' },
    facts.messagingChecked,
    facts.messagingGates,
  ],
  voice: { id: 'voice', section: 'Voice · Gate 3', status: 'partly', statement: 'Plain, direct, second person, no hype.', note: "Inferred from 3 pages. You'll pick the paragraph that sounds right next." },
  missing: { id: 'audience-origin', section: 'Audience · Origin', status: 'needs-you', statement: "Nothing on your pages says who it's for or why you started it.", note: '2 short questions next.' },
  readinessBase: 58,
  questionsLeft: 2,
  timeLeft: 'about 2 minutes',
  deferredNote: "11 more kit sections (values, visual kit, examples and others) appear later in Brand › Kit. They don't block kit v1 (decision D2).",
};

const roundTwo = (letter: string) => ({ value: `r2-${letter.toLowerCase()}`, title: letter, tag: '[narrowed]', body: `[Round 2 paragraph ${letter}, written around your round 1 pick]` });
const gapsVoiceFixture: GapsVoiceData = {
  brandName: 'JamJam',
  alternatives: {
    question: 'What do people use instead of JamJam today?',
    hint: 'Alternatives we found people compare against. Pick, edit or add your own.',
    options: ['Pressmaster', 'Google Pomelli', 'Canva Brand Kit'],
    source: 'Source: competitor research (research 10, segments A and B), each with its link. Delivered by H6 (#35).',
  },
  edgeQuestion: 'What can only you do?',
  originQuestion: 'Why did you start it?',
  originNote: 'Saved as evidence: "owner answer, [date]".',
  voice: {
    intro: 'Three paragraphs written from your site at different settings. Round 2 narrows around your pick.',
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

describe('the Worker serves the Journey contract of PR #75 exactly', () => {
  it('accepts every UI fixture object as its own type', () => {
    expect(readFixture.coverage.percent).toBe(58);
    expect(readFixtureLoading.facts).toEqual([]);
    expect(confirmFixture.facts).toHaveLength(4);
    expect(gapsVoiceFixture.voice.rounds).toHaveLength(2);
  });
  it('has the closed value sets the screens switch on', () => {
    expectTypeOf<EvidenceStatus>().toEqualTypeOf<'found' | 'partly' | 'needs-you'>();
    expectTypeOf<SourceStatus>().toEqualTypeOf<'read' | 'reading' | 'queued' | 'blocked' | 'skipped'>();
    expectTypeOf<FactDecision>().toEqualTypeOf<'accepted' | 'edited' | 'rejected'>();
    expectTypeOf<FactRecord>().toEqualTypeOf<{ decision: 'accepted' | 'rejected'; edit?: undefined } | { decision: 'edited'; edit: string }>();
    expectTypeOf<JourneyCoverage>().toEqualTypeOf<{ found: number; partly: number; needsYou: number; percent: number }>();
    expectTypeOf<JourneySource>().toEqualTypeOf<{ id: string; label: string; status: SourceStatus; facts?: number; reason?: string }>();
    expectTypeOf<JourneyFact>().toEqualTypeOf<{ id: string; section: string; status: EvidenceStatus; statement: string; quote?: string; source?: { label: string; url?: string }; note?: string }>();
  });
  it('the gaps endpoint is GapsVoiceData without the voice rounds, plus the ranked questions', () => {
    expectTypeOf<Omit<GapsData, 'questions'>>().toEqualTypeOf<Omit<GapsVoiceData, 'voice'>>();
    const { voice: _voice, ...gaps } = gapsVoiceFixture;
    const served: GapsData = { ...gaps, questions: [] };
    expect(served.brandName).toBe('JamJam');
  });
});
