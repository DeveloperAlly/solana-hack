import type { ReactNode } from 'react';
import { NavLink, Link as RouterLink, useNavigate } from 'react-router';
import { hubNav } from '../../config/routes';
import { supabase } from '../../lib/supabase';
import { Button } from '../primitives/Button';
import { Logo } from '../brand/Logo';
import styles from './AppShell.module.css';

const tagLabel: Record<string, string> = { 'COMING SOON': 'soon', ROADMAP: 'roadmap', EXPERIMENTAL: 'beta' };

/** L1 AppShell (thin): hub top nav from M1 with tag labels, an optional brand switcher slot, sign out, and a main slot. */
// preview: rendered inside /system, so it must not add a second <main>, skip link or nav landmark name to that page.
// brandSlot: the D48 BrandSwitcher (or any control), placed before Sign out (issue #46).
export function AppShell({ brandName, children, preview = false, brandSlot }: { brandName?: string; children?: ReactNode; preview?: boolean; brandSlot?: ReactNode }) {
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
          <RouterLink to="/home" className={styles.logo}>
            <Logo />{brandName &&<span className={styles.brand}>{brandName}</span>}
          </RouterLink>
          <nav aria-label={preview ? `Hub preview${brandName ? `, ${brandName}` : ''}` : 'Hub'}>
            <ul className={styles.links}>
              {hubNav.map((item) => (
                <li key={item.path}>
                  <NavLink to={item.path} className={({ isActive }) => [styles.link, isActive && styles.active].filter(Boolean).join(' ')}>
                    {item.label}
                    {tagLabel[item.tag] && <span className={styles.tag}>({tagLabel[item.tag]})</span>}
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
