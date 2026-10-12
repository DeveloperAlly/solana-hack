import { Link, Text } from '../../../ui/primitives';
import { checkHref } from '../paths';
import type { LedgerEntry } from '../types';

/** The Ledger "What" cell: a kit shows its hash; a post links to Verify with its text ("Check it", canvas n-led). */
export function VerifyLedgerWhat({ row }: { row: LedgerEntry }) {
  if (row.type === 'kit') {
    return <>{row.what} · hash <Text as="span" variant="mono">{row.hash ?? '[sha256]'}</Text></>;
  }
  const check = row.text ? <Link href={checkHref(row.text)}>Check it</Link> : 'Check it';
  return <>{row.what} · {check}</>;
}
