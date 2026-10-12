import { Badge } from '../primitives/Badge';
import { Link } from '../primitives/Link';

/** The ambassador's name and balance ("Mai T. · 15 USDC"). */
export interface AmbAccount {
  name: string;
  balance: string;
}

export interface AmbAccountChipProps {
  account: AmbAccount | null;
  signInHref: string;
  /** Show the name with the balance ("Mai T. · 15 USDC") or the balance alone (mobile). */
  withName?: boolean;
}

/** The ambassador's balance chip in the frame's actions slot (AppFrame); a Sign in link when signed out. */
export function AmbAccountChip({ account, signInHref, withName = true }: AmbAccountChipProps) {
  if (!account) return <Link href={signInHref}>Sign in</Link>;
  return <Badge>{withName ? `${account.name} · ${account.balance}` : account.balance}</Badge>;
}
