import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { publicNav } from '../../config/routes';
import { Button } from '../primitives/Button';
import { useAuth } from '../../lib/auth';
import styles from './PublicShell.module.css';

export interface PublicShellProps {
  children?: ReactNode;
}

/** L10 PublicShell: public nav from M1 plus a main slot. Signed-out state only in S0. */
export function PublicShell({ children }: PublicShellProps) {
  const links = publicNav.slice(0, -1);
  const { session } = useAuth();
  const signIn = publicNav[publicNav.length - 1];
  const cta = session ? { path: '/home', label: 'Your brand' } : signIn;
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main">
          <RouterLink to="/" className={styles.logo}>
            Waterlily
          </RouterLink>
          <ul className={styles.links}>
            {links.map((item) => (
              <li key={item.path}>
                <RouterLink to={item.path} className={styles.link}>
                  {item.label}
                </RouterLink>
              </li>
            ))}
            <li>
              <Button href={cta.path} variant="secondary">
                {cta.label}
              </Button>
            </li>
          </ul>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
    </div>
  );
}
