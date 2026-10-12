import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { hubNav, routeTagLabels, type NavItem } from '../../config/routes';
import { supabase } from '../../lib/supabase';
import { Button } from '../primitives/Button';
import { AppFrame } from '../layouts/AppFrame';
import { useGalleryMode } from '../hooks/galleryMode';
import styles from './AppShell.module.css';

const livePath = (path: string) => path;

/**
 * One prop set for every page (issue #46; settles ui/48-journey `navHref` and ui/52-superhub `nav`, `homeHref`,
 * `activePath`, `subnav`, `onSignOut`). Content goes in slots; routing goes through one mapping function.
 */
export interface AppShellProps {
  children?: ReactNode;
  /** Brand name beside the logo. */
  brandName?: string;
  /** Slot before Sign out: the D48 BrandSwitcher (or any control). */
  brandSlot?: ReactNode;
  /** Slot under the top bar: section tabs. */
  subnav?: ReactNode;
  /** Nav items (default: the M1 hub nav). */
  nav?: NavItem[];
  /**
   * Maps each nav path, and the logo's /home, to its link target. The gallery maps them to typed screen paths
   * (`(p) => screenPath(boardFor[p])`) so a composed screen's nav stays inside the gallery. Default: the live routes.
   */
  navHref?: (path: string) => string;
  /** The nav path to mark current, when the URL alone cannot say (e.g. a sub-screen). Default: matched from the URL. */
  activePath?: string;
  /** Rendered inside /system: no second main landmark or skip link, a distinct nav name, and Sign out is inert. */
  preview?: boolean;
}

/**
 * L1 AppShell (thin): the hub preset of L11 AppFrame. Hub top nav from M1 with tag labels, a brand slot, Sign out, a
 * subnav slot and the main slot. Sign out is inert in preview and in the gallery (gallery mode, issue #46; Codex
 * review on PR #79), so it can only ever sign a real session out on a live route.
 */
export function AppShell({ children, brandName, brandSlot, subnav, nav = hubNav, navHref = livePath, activePath, preview = false }: AppShellProps) {
  const navigate = useNavigate();
  const gallery = useGalleryMode();
  async function signOut() {
    if (preview || gallery) return;
    await supabase?.auth.signOut();
    navigate('/', { replace: true });
  }
  const items = nav.map((item) => ({
    id: item.path,
    href: navHref(item.path),
    label: (
      <>
        {item.label}
        {routeTagLabels[item.tag].short && <span className={styles.tag}>({routeTagLabels[item.tag].short})</span>}
      </>
    ),
  }));
  return (
    <AppFrame
      homeHref={navHref('/home')}
      preview={preview}
      bodyPadding="none"
      context={brandName}
      nav={{ label: preview ? `Hub preview${brandName ? `, ${brandName}` : ''}` : 'Hub', items, current: activePath }}
      actions={
        <>
          {brandSlot}
          <Button variant="secondary" onClick={signOut}>Sign out</Button>
        </>
      }
      subnav={subnav}
    >
      {children}
    </AppFrame>
  );
}
