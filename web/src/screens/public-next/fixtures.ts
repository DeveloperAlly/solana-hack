// Sample data for the Verify + ledger screens. Filler text is from the canvas artboards; hashes are made-up placeholders.
import type { VerifyNoMatchData } from './Verify2NoMatch';

export const verifyNoMatch: VerifyNoMatchData = {
  query: 'aDNA is launching a token next week. Early holders get 10x rewards.',
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
