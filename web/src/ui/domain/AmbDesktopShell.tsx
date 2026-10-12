import { Link as RouterLink } from 'react-router';
import { Logo } from '../brand/Logo';
import { Container } from '../primitives/Container';
import { AmbAccountChip } from './AmbAccountChip';
import type { AmbShellProps } from './AmbShell';
import styles from './AmbShell.module.css';

/** Desktop ambassador shell (canvas Amb-* ".nav"): logo, Campaigns / My posts / Earnings, balance chip; main below. Part of AmbShell. */
export function AmbDesktopShell({ nav, active, homeHref, account, signInHref, flag, children }: Omit<AmbShellProps, 'device'>) {
  return (
    <div className={styles.desktop}>
      <a className={styles.skip} href="#main">Skip to content</a>
      <header className={styles.topnav}>
        <RouterLink to={homeHref} className={styles.logo}><Logo /></RouterLink>
        {flag}
        <nav aria-label="Ambassador" className={styles.navlinks}>
          <ul className={styles.links}>
            {nav.map((item) => (
              <li key={item.id}>
                <RouterLink to={item.href} className={styles.link} aria-current={item.id === active ? 'page' : undefined}>{item.label}</RouterLink>
              </li>
            ))}
          </ul>
        </nav>
        <AmbAccountChip account={account} signInHref={signInHref} />
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        <Container width="app">{children}</Container>
      </main>
    </div>
  );
}
