import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { hubNav, routeTagLabels, type NavItem } from '../../config/routes';
import { supabase } from '../../lib/supabase';
import { Button } from '../primitives/Button';
import { AppFrame } from '../layouts/AppFrame';
import { useGalleryMode } from '../hooks/galleryMode';
import styles from './AppShell.module.css';

// preview: rendered inside /system, so it must not add a second <main>, skip link or nav landmark name to that page.
// brandSlot: the D48 BrandSwitcher (or any control), placed before Sign out (issue #46).
// Optional, for screens outside the live routes (issue #52, the screen gallery): nav replaces the M1 hub nav, homeHref
// the logo target, activePath marks one nav item as current (when the URL alone cannot), subnav renders below the bar,
// onSignOut replaces the Supabase sign-out. All default to the live behaviour, so existing uses are unchanged.
export interface AppShellProps {
  brandName?: string;
  children?: ReactNode;
  preview?: boolean;
  brandSlot?: ReactNode;
  nav?: NavItem[];
  homeHref?: string;
  activePath?: string;
  subnav?: ReactNode;
  onSignOut?: () => void;
}

/**
 * L1 AppShell (thin): the hub preset of L11 AppFrame. Hub top nav from M1 with tag labels, an optional brand switcher
 * slot, sign out, and a main slot (the chrome itself is AppFrame's, issue #46 shared consolidation).
 */
export function AppShell({ brandName, children, preview = false, brandSlot, nav = hubNav, homeHref = '/home', activePath, subnav, onSignOut }: AppShellProps) {
  const navigate = useNavigate();
  const gallery = useGalleryMode();
  // In the gallery, Sign out is inert unless the screen passes its own (fixture) onSignOut: it never reaches Supabase.
  async function signOut() {
    if (onSignOut) return onSignOut();
    if (gallery) return;
    await supabase?.auth.signOut();
    navigate('/', { replace: true });
  }
  const items = nav.map((item) => ({
    id: item.path,
    href: item.path,
    label: (
      <>
        {item.label}
        {routeTagLabels[item.tag].short && <span className={styles.tag}>({routeTagLabels[item.tag].short})</span>}
      </>
    ),
  }));
  return (
    <AppFrame
      homeHref={homeHref}
      preview={preview}
      bodyPadding="none"
      context={brandName}
      nav={{ label: preview ? `Hub preview${brandName ? `, ${brandName}` : ''}` : 'Hub', items, current: activePath }}
      actions={
        <>
          {brandSlot}
          <Button variant="secondary" onClick={preview ? undefined : signOut}>Sign out</Button>
        </>
      }
      subnav={subnav}
    >
      {children}
    </AppFrame>
  );
}
