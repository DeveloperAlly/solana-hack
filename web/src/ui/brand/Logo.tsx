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
 * JamJam logo (issue #47): an outlined jar with a check mark, drawn in `currentColor` so it follows the theme's text
 * colour. The wordmark is live text in the theme's display font, not outlined, so a new theme restyles it.
 * The path data matches `public/brand/logo-mark.svg`; keep the two in step (see `public/README.md`).
 */
export function Logo({ variant = 'full', size = 'inherit', className }: LogoProps) {
  return (
    <span role="img" aria-label="JamJam" className={[styles.logo, styles[`size-${size}`], className].filter(Boolean).join(' ')}>
      <svg className={styles.mark} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        <rect x="17" y="5" width="30" height="9" rx="2" />
        <path d="M21 14v3c0 3-9 4-9 11v20a9 9 0 0 0 9 9h22a9 9 0 0 0 9-9V28c0-7-9-8-9-11v-3" />
        <path d="M22 38l7 7 13-14" />
      </svg>
      {variant === 'full' && (
        <span className={styles.wordmark} aria-hidden="true">
          JamJam
        </span>
      )}
    </span>
  );
}
