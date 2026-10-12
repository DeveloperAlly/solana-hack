import { Link as RouterLink } from 'react-router';
import { Logo } from '../brand/Logo';
import { AmbAccountChip } from './AmbAccountChip';
import { AmbTabBar } from './AmbTabBar';
import type { AmbShellProps } from './AmbShell';
import styles from './AmbShell.module.css';

/**
 * Mobile ambassador shell (canvas M-* frames, 390 px wide): top bar with the logo and balance or a back link and title,
 * an optional pinned bar, the scrolling body, an optional sticky bottom bar and the tab bar. Part of AmbShell.
 */
export function AmbMobileShell({ nav, active, homeHref, account, signInHref, flag, back, title, tabs = false, pinned, footer, preview = false, children }: Omit<AmbShellProps, 'device'>) {
  const Body = preview ? 'div' : 'main';
  return (
    <div className={`${styles.mobile} ${preview ? styles.preview : ''}`}>
      {!preview && <a className={styles.skip} href="#main">Skip to content</a>}
      <header className={styles.topbar}>
        {back ? (
          <RouterLink to={back.href} className={styles.back} aria-label={back.label}><span aria-hidden="true">←</span></RouterLink>
        ) : (
          <RouterLink to={homeHref} className={styles.logo}><Logo /></RouterLink>
        )}
        {title && <span className={styles.bartitle}>{title}</span>}
        {flag}
        {!back && <span className={styles.end}><AmbAccountChip account={account} signInHref={signInHref} withName={false} /></span>}
      </header>
      {pinned && <div className={styles.pinned}>{pinned}</div>}
      <Body id={preview ? undefined : 'main'} tabIndex={preview ? undefined : -1} className={styles.body}>{children}</Body>
      {footer && <div className={styles.footer}>{footer}</div>}
      {tabs && <AmbTabBar items={nav} active={active} label={preview ? 'Ambassador preview, mobile' : 'Ambassador'} />}
    </div>
  );
}
