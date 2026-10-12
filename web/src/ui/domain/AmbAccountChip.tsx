import { Badge } from '../primitives/Badge';
import { Link } from '../primitives/Link';
import type { AmbAccount } from './AmbShell';

export interface AmbAccountChipProps {
  account: AmbAccount | null;
  signInHref: string;
  /** Show the name with the balance ("Mai T. · 15 USDC") or the balance alone (mobile). */
  withName?: boolean;
}

/** The ambassador's balance chip in the shell; a Sign in link when signed out. Part of AmbShell. */
export function AmbAccountChip({ account, signInHref, withName = true }: AmbAccountChipProps) {
  if (!account) return <Link href={signInHref}>Sign in</Link>;
  return <Badge>{withName ? `${account.name} · ${account.balance}` : account.balance}</Badge>;
}
