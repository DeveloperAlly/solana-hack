import styles from './Logo.module.css';

export type LogoVariant = 'full' | 'mark';
export type LogoSize = 'inherit' | 'md' | 'lg' | 'xl';

export interface LogoProps {
  /** `full`: mark plus the "JamJam" wordmark. `mark`: the mark alone. */
  variant?: LogoVariant;
  /** Font-size token the logo scales with; `inherit` takes the parent's size. */
  size?: LogoSize;
  className?: string;
}

/**
 * JamJam logo (issue #47): the pitch deck's mark, a square with both diagonals (owner, 2026-10-12), drawn in
 * `currentColor` so it follows the theme's text colour. The wordmark is live text in the theme's display font, not
 * outlined, so a new theme restyles it. The geometry matches `public/brand/logo-mark.svg`; keep the two in step
 * (see `public/README.md`).
 */
export function Logo({ variant = 'full', size = 'inherit', className }: LogoProps) {
  return (
    <span role="img" aria-label="JamJam" className={[styles.logo, styles[`size-${size}`], className].filter(Boolean).join(' ')}>
      <svg className={styles.mark} viewBox="0 0 64 64" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
        <rect x="1.5" y="1.5" width="61" height="61" strokeWidth="3" />
        <line x1="1.5" y1="1.5" x2="62.5" y2="62.5" strokeWidth="2" />
        <line x1="62.5" y1="1.5" x2="1.5" y2="62.5" strokeWidth="2" />
      </svg>
      {variant === 'full' && (
        <span className={styles.wordmark} aria-hidden="true">
          JamJam
        </span>
      )}
    </span>
  );
}
