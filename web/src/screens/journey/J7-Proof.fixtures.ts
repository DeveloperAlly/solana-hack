/*
 * Sample data for J7-Proof: canvas board J7-Proof (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board J7-Proof) and
 * its note n-j7-proof, issue #48, backend map §4 rows "Publish and Registered" and "Verify-1, Verify-2, Verify-3".
 * Approver, time, hash and transaction stay bracketed until a real registration exists. The edited-copy diff is the
 * board's example, under its COMING SOON tag.
 */
import type { ProofData } from './types';
import { launchPost } from './journey.fixtures';

export const proofFixture: ProofData = {
  record: { post: 'LinkedIn launch post', kit: 'v1', approvedBy: '[approver] · [time]', hash: '[sha256]' },
  signature: null,
  network: 'devnet',
  postText: launchPost,
  // The live Check a post page (config/routes.ts, /verify); a per-post link needs the registration id (#36).
  checkLink: 'https://jamjam.tech/verify',
  officialNote: 'Exact match to a post JamJam approved, from kit v1.',
  edited: {
    note: 'Today an edited copy shows "Not an official post". Showing what changed needs a fuzzy match Verify doesn\'t have yet (verifyText checks exact text).',
    diff: [
      { kind: 'same', text: '…JamJam reads first ' },
      { kind: 'removed', text: 'and waits for you to approve' },
      { kind: 'added', text: 'and posts for you automatically' },
      { kind: 'same', text: '.' },
    ],
  },
};
