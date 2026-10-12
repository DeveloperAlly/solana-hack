/*
 * Sample data for J5-Approve-Kit: canvas board J5-Approve-Kit (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * J5-Approve-Kit) and its note n-j5-approve-kit, issue #48, backend map §4 rows "Gate 1, Gate 2, Gate 3" and
 * "Onboard-6-Published, Kit-RegisterFailed". Drafts are the board's bracketed placeholders; the failure copy is from
 * board Kit-RegisterFailed. The evidence lists reuse the J1 facts the drafts were built from.
 */
import type { ApproveKitData } from './types';
import { facts, ownerAnswer } from './journey.fixtures';
import { gapsVoiceFixture } from './J4-Gaps-Voice.fixtures';
import { ALTERNATIVES_ID, gateFingerprint, gateView } from './derive';
import { initialSelections } from './useJourneyFlow';

const alternatives = { id: ALTERNATIVES_ID, section: 'Alternatives', status: 'found', statement: 'Pressmaster, Google Pomelli, Canva Brand Kit', note: 'From competitor research (research 10), each with its link.' } as const;

export const approveKitFixture: ApproveKitData = {
  approver: 'ally@…',
  voice: gapsVoiceFixture.voice,
  gates: [
    { id: 'purpose', gate: 1, title: 'Purpose', draft: '[Purpose drafted from 2 facts and your answer]', builtFrom: '2 facts, 1 answer', evidence: [facts.purpose, facts.messagingChecked, { ...ownerAnswer, id: 'answer-origin', section: 'Why you started' }] },
    {
      id: 'positioning',
      gate: 2,
      title: 'Positioning',
      // {alternative} and {edge} are filled from J4 (the first alternative picked, the "only you" answer); bracketed until then.
      draft: 'For [audience] who [need], JamJam is [category] that [benefit]. Unlike {alternative}, {edge}.',
      builtFrom: '1 fact, 2 answers, 3 alternatives',
      evidence: [facts.positioning, { ...ownerAnswer, id: 'answer-edge', section: 'What only you do' }, alternatives],
    },
    {
      id: 'voice',
      gate: 3,
      title: 'Voice',
      draft: 'Candid founder, narrowed in round 2: plain words, short sentences, no emoji, soft call to action.',
      builtFrom: 'your 2 picks, 3 pages',
      evidence: [facts.voiceRead],
    },
  ],
  alsoDrafted: [
    { label: 'Audience', value: 'Drafted, confirm' },
    { label: 'Origin story', value: 'Drafted, confirm' },
    { label: 'Messaging', value: 'Drafted, confirm' },
  ],
  onChain: "The kit's hash, version, your approver id and whether your domain is verified. Your words stay off-chain.",
};

/** Error: all three gates were approved, then registration failed; the kit stays approved (Kit-RegisterFailed). */
export const approveKitFixtureFailed: ApproveKitData = {
  ...approveKitFixture,
  // Each loaded approval carries the fingerprint of the draft it approved (the gate as loaded, before any edit this
  // visit), so it goes stale like one made here.
  gates: approveKitFixture.gates.map((g) => ({
    ...g,
    approval: { decision: { status: 'approved', by: '[approver]', at: '[time]' }, fingerprint: gateFingerprint(gateView(g, initialSelections, approveKitFixture.voice)) },
  })),
  registration: { reason: "[Plain-language reason, e.g. \"the network didn't confirm in time\"]", hash: '[sha256 of kit v1]', lastTry: '[time]' },
};
