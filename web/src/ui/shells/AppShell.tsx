import type { ReactNode } from 'react';
import { NavLink, Link as RouterLink, useNavigate } from 'react-router';
import { hubNav } from '../../config/routes';
import { supabase } from '../../lib/supabase';
import { Button } from '../primitives/Button';
import styles from './AppShell.module.css';

const tagLabel: Record<string, string> = { 'COMING SOON': 'soon', ROADMAP: 'roadmap', EXPERIMENTAL: 'beta' };

/** L1 AppShell (thin): hub top nav from M1 with tag labels, sign out, and a main slot. */
export function AppShell({ brandName, children }: { brandName?: string; children?: ReactNode }) {
  const navigate = useNavigate();
  async function signOut() {
    await supabase?.auth.signOut();
    navigate('/', { replace: true });
  }
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">Skip to content</a>
      <header className={styles.header}>
        <div className={styles.bar}>
          <RouterLink to="/home" className={styles.logo}>
            Waterlily{brandName && <span className={styles.brand}>{brandName}</span>}
          </RouterLink>
          <nav aria-label="Hub">
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
          <Button variant="secondary" onClick={signOut}>Sign out</Button>
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>{children}</main>
    </div>
  );
}
