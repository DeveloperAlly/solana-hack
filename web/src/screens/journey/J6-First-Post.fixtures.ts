/*
 * Sample data for J6-First-Post: canvas board J6-First-Post (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * J6-First-Post) and its note n-j6-first-post, issue #48, backend map §4 rows "Create-NewDraft" and "Draft-Review".
 * The LinkedIn draft is the board's sample draft; the board draws no X version, so it stays a bracketed placeholder.
 * "[score]" and "[n]" stay bracketed: no figures are invented. The polish samples are illustrative rewrites of the board's
 * draft, one per action, each made from the original (live, POST /api/brands/:id/posts/:id/polish returns the rewrite).
 */
import type { FirstPostData } from './types';
import { facts } from './journey.fixtures';
import type { JourneyClaimSegment } from './types';

const voiceClaim: JourneyClaimSegment = { text: 'drafts posts in your voice', claimId: 'voice' };
const checkClaim: JourneyClaimSegment = { text: 'Anyone can check what really came from you', claimId: 'check' };

export const firstPostFixture: FirstPostData = {
  channels: [
    {
      id: 'linkedin',
      label: 'LinkedIn',
      segments: [
        { text: 'Every brand tool I tried asked me questions my website already answered. So JamJam reads first. It shows you each fact with the line it came from, ' },
        { text: 'drafts posts in your voice', claimId: 'voice' },
        { text: ', and waits for you to approve them. ' },
        { text: 'Anyone can check what really came from you', claimId: 'check' },
        { text: '. Built in public: our own kit is on the ledger.' },
      ],
      polish: {
        Review: [
          { text: 'Every brand tool I tried asked me questions my website already answered. So JamJam reads first: it shows each fact with the line it came from, ' },
          voiceClaim,
          { text: ' and waits for your approval. ' },
          checkClaim,
          { text: '. Built in public: our own kit is on the ledger.' },
        ],
        Shorten: [{ text: 'Brand tools kept asking what my website already said. JamJam reads first, ' }, voiceClaim, { text: ' and waits for your approval. ' }, checkClaim, { text: '.' }],
        Clarify: [
          { text: 'Every brand tool I tried asked me questions my website already answered. JamJam reads your site first and shows each fact with the line it came from. Then it ' },
          voiceClaim,
          { text: ' and waits for you to approve them. ' },
          checkClaim,
          { text: '. Our own kit is on the public ledger.' },
        ],
        Beautify: [
          { text: 'Every brand tool I tried asked me questions my website already answered.\n\nSo JamJam reads first. It shows you each fact with the line it came from, ' },
          voiceClaim,
          { text: ', and waits for you to approve them.\n\n' },
          checkClaim,
          { text: '.\n\nBuilt in public: our own kit is on the ledger.' },
        ],
      },
    },
    { id: 'x', label: 'X', segments: [{ text: '[X version of the first post, from kit v1]' }] },
  ],
  claims: [
    { id: 'check', text: 'Anyone can check what really came from you', evidence: facts.purpose },
    { id: 'voice', text: 'drafts posts in your voice', evidence: facts.messagingChecked },
  ],
  checks: {
    slop: { label: 'No-AI-slop pass', passed: true },
    voiceFit: { label: 'Voice fit', value: '[score] · self-graded today; independent score proposed' },
  },
  blocked: { claim: 'Used by [n] brands', message: 'has no evidence. Add a source or remove it.' },
  polishActions: ['Review', 'Shorten', 'Clarify', 'Beautify'],
};
