// Sample data for the Ledger (issue #49). Post rows come from the same registered posts Verify checks, so "Check it"
// finds them; kit rows are the kits the canvas names.
// Sources (AGENTS rule 6): canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Ledger (JamJam kit v1 with
// hash [sha256], LinkedIn launch post, [date], [approver], [tx]; brand switcher JamJam / aDNA; note n-led "kits and
// posts only") and board Verify-1-Match (aDNA kit v1, LinkedIn post approved 5 Oct 2026 16:18); backend map
// .agentic/what/context/backend_map.md §4, row "Ledger" (GET /api/ledger; tables registrations, payouts).
import type { LedgerData, LedgerEntry } from './types';
import { adna, jamjam, registeredPosts } from './posts.fixtures';

const kitRow = (brandId: string): LedgerEntry => ({
  id: `kit-${brandId}-1`,
  brandId,
  type: 'kit',
  date: null,
  what: 'Kit v1',
  kitVersion: 1,
  approver: '[approver]',
  hash: '[sha256]',
  signature: null,
});

// Retracted posts are not listed: the canvas Ledger draws kits and posts only (n-led).
const postRows: LedgerEntry[] = registeredPosts
  .filter((p) => !p.retraction)
  .map((p) => ({
    id: p.id,
    brandId: p.brand.id,
    type: 'post',
    date: p.approvedAt,
    what: p.label,
    kitVersion: p.kitVersion,
    approver: p.approver,
    text: p.text,
    signature: p.signature,
  }));

export const ledger: LedgerData = {
  brands: [
    { ...jamjam, kitVersion: 1, verified: true },
    { ...adna, kitVersion: 1, verified: true },
  ],
  entries: [...postRows, kitRow(jamjam.id), kitRow(adna.id)],
  // Small so the sample rows show paging (aDNA has three); the real page size is set with GET /api/ledger (#36).
  pageSize: 2,
};

/** Empty state: a brand with nothing registered yet. */
export const ledgerEmpty: LedgerData = { ...ledger, entries: [] };
