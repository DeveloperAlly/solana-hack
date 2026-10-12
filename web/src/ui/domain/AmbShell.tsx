import type { ReactNode } from 'react';
import { AmbDesktopShell } from './AmbDesktopShell';
import { AmbMobileShell } from './AmbMobileShell';

export interface AmbNavItem {
  id: string;
  label: string;
  href: string;
}

export interface AmbAccount {
  name: string;
  balance: string;
}

export interface AmbShellProps {
  device: 'desktop' | 'mobile';
  /** Campaigns, My posts, Earnings: the top nav on desktop, the tab bar on mobile. */
  nav: AmbNavItem[];
  /** id of the current nav item (aria-current="page"). */
  active?: string;
  homeHref: string;
  /** The ambassador's name and balance chip; null when signed out (a Sign in link instead). */
  account: AmbAccount | null;
  signInHref: string;
  /** Tag flag beside the logo (ComingSoonFlag). */
  flag?: ReactNode;
  /** Mobile: a back link and title replace the logo in the top bar. */
  back?: { href: string; label: string };
  title?: string;
  /** Mobile: show the bottom tab bar (list and status screens). */
  tabs?: boolean;
  /** Mobile: pinned under the top bar while the body scrolls (the on-brand meter, canvas note n-m3). */
  pinned?: ReactNode;
  /** Mobile: sticky bottom bar (Join, Publish; canvas notes n-m2, n-m3). */
  footer?: ReactNode;
  children?: ReactNode;
}

const shells = { desktop: AmbDesktopShell, mobile: AmbMobileShell } as const;

/**
 * Ambassador shell (L1 AppShell for the ambassador seat, with L4 MobileTabBar): a top nav on desktop; on mobile a
 * phone-width frame with a top bar, optional pinned and sticky bottom bars, and a tab bar. Skip link and one <main>.
 */
export function AmbShell({ device, ...props }: AmbShellProps) {
  const Shell = shells[device];
  return <Shell {...props} />;
}
