import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import { Logo } from '../brand/Logo';
import styles from './BuilderShell.module.css';

export interface BuilderShellProps {
  /** Context line beside the logo, e.g. "Build your brand: JamJam". */
  context: string;
  /** Status chips after the context line (Unverified flag, canvas tag). */
  flags?: ReactNode;
  /** Header action, e.g. the "Save and finish later" link. */
  action?: ReactNode;
  /** Where the logo goes. */
  homeHref?: string;
  /** Rendered inside another page (the /system workbench): no skip link, banner or main landmark of its own. */
  preview?: boolean;
  children?: ReactNode;
}

/**
 * Brand Builder page chrome (canvas boards Onboard-1 … Onboard-6, BB-*): logo, context line, flags and one header action,
 * then the main slot. The wizard body inside is WizardLayout (L6); this is only the frame around it.
 */
export function BuilderShell({ context, flags, action, homeHref = '/', preview = false, children }: BuilderShellProps) {
  const Header = preview ? 'div' : 'header';
  const Main = preview ? 'div' : 'main';
  return (
    <div className={styles.shell}>
      {!preview && <a className={styles.skip} href="#main">Skip to content</a>}
      <Header className={styles.header}>
        <div className={styles.bar}>
          <RouterLink to={homeHref} className={styles.logo}><Logo /></RouterLink>
          <span className={styles.context}>{context}</span>
          {flags}
          {action && <span className={styles.action}>{action}</span>}
        </div>
      </Header>
      <Main id={preview ? undefined : 'main'} tabIndex={preview ? undefined : -1} className={styles.main}>{children}</Main>
    </div>
  );
}
