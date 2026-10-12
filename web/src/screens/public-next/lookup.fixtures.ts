// Sample data for Verify-4-Kit-Account-Claim (issue #49, coming soon).
// Sources (AGENTS rule 6): canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Verify-4-Kit-Account-Claim
// (tabs Post, Account, Kit version, Claim; account "linkedin.com/company/[jamjam]" -> "Official account of JamJam",
// registered [date]; proto note) and board Ledger (JamJam kit v1, hash [sha256]); backend map
// .agentic/what/context/backend_map.md §4, row "Verify-1, Verify-2, Verify-3" (GET /api/verify/{kit,account,claim}).
// No claim is registered on the canvas, so the claim list is empty and a claim check reports "not found".
import type { VerifyLookupData } from './types';

export const verifyLookup: VerifyLookupData = {
  initialTab: 'account',
  queries: { account: 'linkedin.com/company/[jamjam]', kit: '[sha256]', claim: '' },
  records: [
    { kind: 'account', key: 'linkedin.com/company/[jamjam]', brandName: 'JamJam', title: 'Official account of JamJam', registeredAt: null, signature: null },
    { kind: 'kit', key: '[sha256]', brandName: 'JamJam', title: 'Kit v1 of JamJam', registeredAt: null, signature: null },
  ],
  note: 'Drawn, not built. Defined in: PRD #2 (verify badge, official accounts); backlog row L3a (draft).',
  errorNote: 'The registry could not be read just now, so this cannot be confirmed. Try again in a minute.',
};
