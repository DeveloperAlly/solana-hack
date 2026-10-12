import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { publicNav } from '../../config/routes';
import { Button } from '../primitives/Button';
import { Logo } from '../brand/Logo';
import { useAuth } from '../../lib/auth';
import { usePublicNavHref } from '../hooks/usePublicNavHref';
import styles from './PublicShell.module.css';

export interface PublicShellProps {
  children?: ReactNode;
  /**
   * Maps each nav path (and the logo's "/") to its link target. The screen gallery points them at /screens/<Artboard>
   * so a composed screen's links stay inside the gallery (issue #48). Default: the live routes, and in the gallery each
   * path's canvas board (ui/hooks/usePublicNavHref.ts).
   */
  navHref?: (path: string) => string;
  /**
   * Replaces the nav links with other header content, e.g. a sign-in status chip and "Save and exit" on the
   * first-run Journey steps (canvas boards J1 to J7, issue #48).
   */
  actions?: ReactNode;
}

/** L10 PublicShell: public nav from M1 plus a main slot; optional header actions in place of the links. */
export function PublicShell({ children, navHref: given, actions }: PublicShellProps) {
  const fallback = usePublicNavHref();
  const navHref = given ?? fallback;
  const links = publicNav.slice(0, -1);
  const { session } = useAuth();
  const signIn = publicNav[publicNav.length - 1];
  const cta = session ? { path: '/home', label: 'Your brand' } : signIn;
  return (
    <div className={styles.shell} data-shell="public">
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Main">
          <RouterLink to={navHref('/')} className={styles.logo}>
            <Logo />
          </RouterLink>
          {actions ? (
            <div className={styles.links}>{actions}</div>
          ) : (
            <ul className={styles.links}>
              {links.map((item) => (
                <li key={item.path}>
                  <RouterLink to={navHref(item.path)} className={styles.link}>
                    {item.label}
                  </RouterLink>
                </li>
              ))}
              <li>
                <Button href={navHref(cta.path)} variant="secondary">
                  {cta.label}
                </Button>
              </li>
            </ul>
          )}
        </nav>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
    </div>
  );
}
