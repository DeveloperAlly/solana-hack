import type { ReactNode } from 'react';
import { NavLink, Link as RouterLink } from 'react-router';
import { Logo } from '../brand/Logo';
import { MobileTabBar } from './MobileTabBar';
import type { ShellId } from '../../config/nav';
import styles from './AppFrame.module.css';

export interface FrameNavItem {
  id: string;
  label: ReactNode;
  href: string;
}

export interface FrameNav {
  /** Accessible name of the nav landmark, e.g. "Hub" or "Ambassador". */
  label: string;
  items: FrameNavItem[];
  /** id of the current item. When omitted, the router marks the item whose href matches the URL. */
  current?: string;
  /** `header` (default): links in the top bar. `tabs`: a bottom tab bar, drawn by L4 MobileTabBar. */
  placement?: 'header' | 'tabs';
}

export interface AppFrameProps {
  /** Where the logo goes. */
  homeHref: string;
  /** A back link that replaces the logo (mobile detail screens). */
  back?: { href: string; label: string };
  /** Bar title after the logo or back link (mobile). */
  title?: ReactNode;
  /** Context line after the logo, e.g. "Build your brand: JamJam" or the current brand name. */
  context?: ReactNode;
  /** Chips after the context: Unverified flag, canvas tag. */
  flags?: ReactNode;
  nav?: FrameNav;
  /** End of the top bar: brand switcher, account chip, Sign out, "Save and finish later". */
  actions?: ReactNode;
  /** Full-width row under the top bar (section tabs). */
  subnav?: ReactNode;
  /** Pinned under the top bar while the body scrolls (the mobile on-brand meter). */
  pinned?: ReactNode;
  /** Sticky bottom bar (Join, Publish). */
  footer?: ReactNode;
  /** `app` (default): full width, bar capped at the app width. `phone`: a phone-width column (the canvas M-* frames). */
  width?: 'app' | 'phone';
  /** `page` (default): page padding around the body. `none`: the body sets its own (the hub screens). */
  bodyPadding?: 'page' | 'none';
  /** Rendered inside another page (the /system workbench): no skip link, banner or main landmark of its own. */
  preview?: boolean;
  /** Who the frame is for (ADR-012 shells by role): `app` (default; owner and team) or `ambassador`. Marked as `data-shell`. */
  shell?: Exclude<ShellId, 'public'>;
  children?: ReactNode;
}

function NavLinks({ nav }: { nav: FrameNav }) {
  return (
    <ul className={styles.links}>
      {nav.items.map((item) => (
        <li key={item.id}>
          {nav.current === undefined ? (
            <NavLink to={item.href} className={styles.link}>{item.label}</NavLink>
          ) : (
            <RouterLink to={item.href} className={styles.link} aria-current={item.id === nav.current ? 'page' : undefined}>{item.label}</RouterLink>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * L11 AppFrame: the page chrome every signed-in or wizard screen shares. Skip link, a top bar (logo or back link,
 * title, context, flags, nav, actions), optional subnav and pinned rows, one main landmark, and optional sticky
 * footer and bottom tab bar; full width or a phone-width column. L1 AppShell is a preset of it for the hub.
 * Replaces BuilderShell, AmbShell, AmbDesktopShell, AmbMobileShell and AmbTabBar (issue #46, shared consolidation).
 */
export function AppFrame({ homeHref, back, title, context, flags, nav, actions, subnav, pinned, footer, width = 'app', bodyPadding = 'page', preview = false, shell = 'app', children }: AppFrameProps) {
  const Header = preview ? 'div' : 'header';
  const Main = preview ? 'div' : 'main';
  const tabs = nav?.placement === 'tabs';
  return (
    <div className={`${styles.frame} ${styles[width]}`} data-shell={shell}>
      {!preview && <a className={styles.skip} href="#main">Skip to content</a>}
      <Header className={styles.header}>
        <div className={styles.bar}>
          {back ? (
            <RouterLink to={back.href} className={styles.back} aria-label={back.label}><span aria-hidden="true">←</span></RouterLink>
          ) : (
            <RouterLink to={homeHref} className={styles.logo}><Logo /></RouterLink>
          )}
          {title != null && <span className={styles.title}>{title}</span>}
          {context != null && <span className={styles.context}>{context}</span>}
          {flags}
          {(nav && !tabs) || actions ? (
            <div className={styles.end}>
              {nav && !tabs && <nav aria-label={nav.label}><NavLinks nav={nav} /></nav>}
              {actions}
            </div>
          ) : null}
        </div>
        {subnav != null && <div className={styles.subnav}>{subnav}</div>}
      </Header>
      {pinned != null && <div className={styles.pinned}>{pinned}</div>}
      <Main id={preview ? undefined : 'main'} tabIndex={preview ? undefined : -1} className={`${styles.main} ${styles[`pad-${bodyPadding}`]}`}>
        {children}
      </Main>
      {/* One sticky bottom region, the footer stacked above the tab bar, so the two never overlap (Codex review on PR #80). */}
      {(footer || (nav && tabs)) && (
        <div className={styles.bottom} data-frame-bottom="">
          {footer != null && <div className={styles.footer}>{footer}</div>}
          {nav && tabs && <MobileTabBar label={nav.label} items={nav.items} current={nav.current} />}
        </div>
      )}
    </div>
  );
}
