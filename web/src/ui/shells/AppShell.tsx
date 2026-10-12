import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { hubNav, routeTagLabels, type NavItem } from '../../config/routes';
import { mobileTabFor, mobileTabs, type StageId } from '../../config/nav';
import { supabase } from '../../lib/supabase';
import { Button } from '../primitives/Button';
import { AppFrame } from '../layouts/AppFrame';
import { StageNav } from '../layouts/StageNav';
import { StageTabs } from '../layouts/StageTabs';
import { useGalleryMode } from '../hooks/galleryMode';
import { useNavHref } from '../hooks/useNavHref';
import styles from './AppShell.module.css';

const livePath = (path: string) => path;
/** The logo's target in the loop shell: the landing page, as every canvas v21 app board links it (board "Main"). */
const landing = { artboard: 'Main', live: '/' } as const;

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
  /**
   * The loop stage this screen belongs to (config/nav.ts; ADR-012 decision 2). When set, the shell renders the one
   * main nav (L2 StageNav) with this stage current, in place of `nav` and `navHref`, and the stage's tabs (L3
   * StageTabs) under the bar unless `subnav` is given. Without it the shell is the live hub shell, unchanged.
   */
  stage?: StageId;
  /** The current tab of `stage` (a tab id in config/nav.ts). */
  tab?: string;
  /**
   * With `stage`: `app` (default) is the desktop shell; `phone` is a phone-width column (the canvas M-* boards) with
   * the loop's mobile tab bar (L4 MobileTabBar: Today, Create, Verify, Grow, More) in place of the main nav and tabs.
   */
  width?: 'app' | 'phone';
}

/**
 * L1 AppShell (thin): the hub preset of L11 AppFrame. Hub top nav from M1 with tag labels, a brand slot, Sign out, a
 * subnav slot and the main slot. Sign out is inert in preview and in the gallery (gallery mode, issue #46; Codex
 * review on PR #79), so it can only ever sign a real session out on a live route.
 */
export function AppShell(props: AppShellProps) {
  return props.stage ? <LoopShell {...props} stage={props.stage} /> : <HubShell {...props} />;
}

/** Sign out, inert in preview and in the gallery. */
function useSignOut(preview: boolean) {
  const navigate = useNavigate();
  const gallery = useGalleryMode();
  return async function signOut() {
    if (preview || gallery) return;
    await supabase?.auth.signOut();
    navigate('/', { replace: true });
  };
}

/** The loop shell: one main nav, the stage's tabs, or the mobile tab bar at phone width (config/nav.ts). */
function LoopShell({ children, brandName, brandSlot, subnav, preview = false, stage, tab, width = 'app' }: AppShellProps & { stage: StageId }) {
  const signOut = useSignOut(preview);
  const href = useNavHref();
  const phone = width === 'phone';
  const label = preview ? 'Main preview' : 'Main';
  return (
    <AppFrame
      homeHref={href(landing)}
      preview={preview}
      width={width}
      bodyPadding={phone ? 'page' : 'none'}
      context={brandName}
      nav={phone ? { label, placement: 'tabs', current: mobileTabFor(stage).id, items: mobileTabs.map((t) => ({ id: t.id, label: t.label, href: href(t) })) } : undefined}
      actions={
        <>
          {!phone && <StageNav current={stage} label={label} />}
          {brandSlot}
          {!phone && <Button variant="secondary" onClick={signOut}>Sign out</Button>}
        </>
      }
      subnav={phone ? undefined : (subnav ?? <StageTabs stage={stage} current={tab} />)}
    >
      {children}
    </AppFrame>
  );
}

/** The live hub shell: the M1 hub nav (config/routes.ts `hubNav`), routed through `navHref`. */
function HubShell({ children, brandName, brandSlot, subnav, nav = hubNav, navHref = livePath, activePath, preview = false }: AppShellProps) {
  const signOut = useSignOut(preview);
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
