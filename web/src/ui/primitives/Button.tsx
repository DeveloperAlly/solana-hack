import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link as RouterLink } from 'react-router';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary';

interface Common {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children?: ReactNode;
  className?: string;
}
export type ButtonProps = Common &
  (
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>)
    | { href: string; onClick?: () => void; 'aria-label'?: string }
  );

/** P8 Button: primary or secondary; renders as a router link when given href. */
export function Button(props: ButtonProps) {
  const { variant = 'primary', fullWidth = false, className, children } = props;
  const cls = [styles.button, styles[variant], fullWidth && styles.full, className].filter(Boolean).join(' ');
  if (props.href !== undefined) {
    return (
      <RouterLink to={props.href} className={cls} onClick={props.onClick} aria-label={props['aria-label']}>
        {children}
      </RouterLink>
    );
  }
  const { variant: _v, fullWidth: _f, className: _c, href: _h, type = 'button', ...rest } = props;
  return (
    <button {...rest} type={type} className={cls}>
      {children}
    </button>
  );
}
