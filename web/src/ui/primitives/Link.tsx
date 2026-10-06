import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import styles from './Link.module.css';

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** Internal path or external URL. */
  href: string;
  /** External links open in a new tab and say so. */
  external?: boolean;
  children?: ReactNode;
}

/** P7 Link: internal (router) or external (new tab, labelled). */
export function Link({ href, external = false, className, children, ...rest }: LinkProps) {
  const cls = [styles.link, className].filter(Boolean).join(' ');
  if (external) {
    return (
      <a {...rest} href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
        <span className="wl-visually-hidden"> (opens in new tab)</span>
        <span aria-hidden="true"> ↗</span>
      </a>
    );
  }
  return (
    <RouterLink {...rest} to={href} className={cls}>
      {children}
    </RouterLink>
  );
}
