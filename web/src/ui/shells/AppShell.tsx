import type { ReactNode } from 'react';
import { NavLink, Link as RouterLink, useNavigate } from 'react-router';
import { hubNav, type NavItem } from '../../config/routes';
import { supabase } from '../../lib/supabase';
import { Button } from '../primitives/Button';
import { Logo } from '../brand/Logo';
import styles from './AppShell.module.css';

const tagLabel: Record<string, string> = { 'COMING SOON': 'soon', ROADMAP: 'roadmap', EXPERIMENTAL: 'beta' };

/** L1 AppShell (thin): hub top nav from M1 with tag labels, an optional brand switcher slot, sign out, and a main slot. */
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

export function AppShell({ brandName, children, preview = false, brandSlot, nav = hubNav, homeHref = '/home', activePath, subnav, onSignOut }: AppShellProps) {
  const navigate = useNavigate();
  async function signOut() {
    if (onSignOut) return onSignOut();
    await supabase?.auth.signOut();
    navigate('/', { replace: true });
  }
  const linkClass = (active: boolean) => [styles.link, active && styles.active].filter(Boolean).join(' ');
  return (
    <div className={styles.shell}>
      {!preview && <a className={styles.skip} href="#main">Skip to content</a>}
      <header className={styles.header}>
        <div className={styles.bar}>
          <RouterLink to={homeHref} className={styles.logo}>
            <Logo />{brandName &&<span className={styles.brand}>{brandName}</span>}
          </RouterLink>
          <nav aria-label={preview ? `Hub preview${brandName ? `, ${brandName}` : ''}` : 'Hub'}>
            <ul className={styles.links}>
              {nav.map((item) => {
                const label = (
                  <>
                    {item.label}
                    {tagLabel[item.tag] && <span className={styles.tag}>({tagLabel[item.tag]})</span>}
                  </>
                );
                return (
                  <li key={item.path}>
                    {activePath === undefined ? (
                      <NavLink to={item.path} className={({ isActive }) => linkClass(isActive)}>{label}</NavLink>
                    ) : (
                      <RouterLink to={item.path} className={linkClass(activePath === item.path)} aria-current={activePath === item.path ? 'page' : undefined}>{label}</RouterLink>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
          {brandSlot}
          <Button variant="secondary" onClick={preview ? undefined : signOut}>Sign out</Button>
        </div>
        {subnav && <div className={styles.subnav}>{subnav}</div>}
      </header>
      {preview ? <div className={styles.main}>{children}</div> : <main id="main" tabIndex={-1} className={styles.main}>{children}</main>}
    </div>
  );
}
