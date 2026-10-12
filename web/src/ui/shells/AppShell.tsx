import type { ReactNode } from 'react';
import { NavLink, Link as RouterLink, useNavigate } from 'react-router';
import { hubNav, routeTagLabels } from '../../config/routes';
import { supabase } from '../../lib/supabase';
import { Button } from '../primitives/Button';
import { Logo } from '../brand/Logo';
import styles from './AppShell.module.css';

/** L1 AppShell (thin): hub top nav from M1 with tag labels, an optional brand switcher slot, sign out, and a main slot. */
// preview: rendered inside /system, so it must not add a second <main>, skip link or nav landmark name to that page.
// brandSlot: the D48 BrandSwitcher (or any control), placed before Sign out (issue #46).
// navHref: maps each nav path (and the logo's /home) to the link target; the screen gallery points them at
// /screens/<Artboard> so a composed screen's nav stays inside the gallery (issue #48). Defaults to the live routes.
const livePath = (path: string) => path;
export function AppShell({ brandName, children, preview = false, brandSlot, navHref = livePath }: { brandName?: string; children?: ReactNode; preview?: boolean; brandSlot?: ReactNode; navHref?: (path: string) => string }) {
  const navigate = useNavigate();
  async function signOut() {
    await supabase?.auth.signOut();
    navigate('/', { replace: true });
  }
  return (
    <div className={styles.shell}>
      {!preview && <a className={styles.skip} href="#main">Skip to content</a>}
      <header className={styles.header}>
        <div className={styles.bar}>
          <RouterLink to={navHref('/home')} className={styles.logo}>
            <Logo />{brandName &&<span className={styles.brand}>{brandName}</span>}
          </RouterLink>
          <nav aria-label={preview ? `Hub preview${brandName ? `, ${brandName}` : ''}` : 'Hub'}>
            <ul className={styles.links}>
              {hubNav.map((item) => (
                <li key={item.path}>
                  <NavLink to={navHref(item.path)} className={({ isActive }) => [styles.link, isActive && styles.active].filter(Boolean).join(' ')}>
                    {item.label}
                    {routeTagLabels[item.tag].short && <span className={styles.tag}>({routeTagLabels[item.tag].short})</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {brandSlot}
          <Button variant="secondary" onClick={preview ? undefined : signOut}>Sign out</Button>
        </div>
      </header>
      {preview ? <div className={styles.main}>{children}</div> : <main id="main" tabIndex={-1} className={styles.main}>{children}</main>}
    </div>
  );
}
