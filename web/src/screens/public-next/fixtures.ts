// Sample data for the Verify + ledger screens (built in #46 as the sample screen; the rest of the page is #49).
// Source of the filler text: the wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board
// Verify-2-NoMatch, which shows this pasted text and the "Not found" result.
// The hash is a placeholder, not a real fingerprint: fixtures use filler values only (issue #46, "Templates";
// issue #45, "Rules for every sub-issue": sample data lives in a fixtures file, no network calls).
// The error note repeats the live Worker's wording for an unreachable Solana RPC (web/worker/posts.ts, verifyText).
import type { VerifyNoMatchData } from './Verify2NoMatch';

export const verifyNoMatch: VerifyNoMatchData = {
  // A made-up impersonation claim (the canvas sample), bracketed so it never reads as real aDNA content.
  query: '[Sample impersonation] aDNA is launching a token next week. Early holders get 10x rewards.',
  result: {
    official: false,
    checked: true,
    hash: '0000000000000000000000000000000000000000000000000000000000000000',
  },
};

export const verifyNoMatchError: VerifyNoMatchData = {
  ...verifyNoMatch,
  result: { ...verifyNoMatch.result, checked: false, note: 'Solana could not be checked just now, so this cannot be confirmed. Try again in a minute.' },
};
