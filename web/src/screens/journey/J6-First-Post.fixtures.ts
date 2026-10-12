/*
 * Sample data for J6-First-Post: canvas board J6-First-Post (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * J6-First-Post) and its note n-j6-first-post, issue #48, backend map §4 rows "Create-NewDraft" and "Draft-Review".
 * The LinkedIn draft is the board's sample draft; the board draws no X version, so it stays a bracketed placeholder.
 * "[score]" and "[n]" stay bracketed: no figures are invented.
 */
import type { FirstPostData } from './types';
import { facts } from './journey.fixtures';

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
    },
    { id: 'x', label: 'X', segments: [{ text: '[X version of the first post, from kit v1]' }] },
  ],
  claims: [
    { id: 'check', text: 'Anyone can check what really came from you', evidence: facts.purpose },
    { id: 'voice', text: 'drafts posts in your voice', evidence: facts.messagingChecked },
  ],
  checks: [
    { label: 'No-AI-slop pass', value: 'Passed', solid: true },
    { label: 'Claims: 2 of 2 backed', value: 'Passed', solid: true },
    { label: 'Voice fit', value: '[score] · self-graded today; independent score proposed' },
  ],
  blocked: { claim: 'Used by [n] brands', message: 'has no evidence. Add a source or remove it.' },
  polishActions: ['Review', 'Shorten', 'Clarify', 'Beautify'],
};
