/*
 * Sample data for J5-Approve-Kit: canvas board J5-Approve-Kit (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * J5-Approve-Kit) and its note n-j5-approve-kit, issue #48, backend map §4 rows "Gate 1, Gate 2, Gate 3" and
 * "Onboard-6-Published, Kit-RegisterFailed". Drafts are the board's bracketed placeholders; the failure copy is from
 * board Kit-RegisterFailed. The evidence lists reuse the J1 facts the drafts were built from.
 */
import type { ApproveKitData } from './types';
import { facts, ownerAnswer } from './journey.fixtures';

const alternatives = { id: 'alternatives', section: 'Alternatives', status: 'found', statement: 'Pressmaster, Google Pomelli, Canva Brand Kit', note: 'From competitor research (research 10), each with its link.' } as const;

export const approveKitFixture: ApproveKitData = {
  approver: 'ally@…',
  gates: [
    { id: 'purpose', gate: 1, title: 'Purpose', draft: '[Purpose drafted from 2 facts and your answer]', builtFrom: '2 facts, 1 answer', evidence: [facts.purpose, facts.messagingChecked, ownerAnswer] },
    {
      id: 'positioning',
      gate: 2,
      title: 'Positioning',
      draft: 'For [audience] who [need], JamJam is [category] that [benefit]. Unlike Pressmaster, [edge].',
      builtFrom: '1 fact, 2 answers, 3 alternatives',
      evidence: [facts.positioning, ownerAnswer, alternatives],
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
  gates: approveKitFixture.gates.map((g) => ({ ...g, decision: { by: '[approver]', at: '[time]' } })),
  registration: { reason: "[Plain-language reason, e.g. \"the network didn't confirm in time\"]", hash: '[sha256 of kit v1]', lastTry: '[time]' },
};
