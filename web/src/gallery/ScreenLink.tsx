import type { ReactNode } from 'react';
import { Link } from '../ui/primitives/Link';
import { Button, type ButtonVariant } from '../ui/primitives/Button';
import type { ScreenState } from '../ui/composites/DemoStateSwitcher';
import { useScreenHref } from './screenPath';

export interface ScreenLinkProps {
  /** Target artboard, e.g. "Verify-1-Match". */
  artboard: string;
  /** Open the target in this state; leave out for its default state. */
  state?: ScreenState;
  /** Render as a P7 Link (default) or a P8 Button styled link. */
  as?: 'link' | 'button';
  variant?: ButtonVariant;
  children: ReactNode;
}

/** A link from one gallery screen to another that keeps the current theme (and sets a state when asked). */
export function ScreenLink({ artboard, state, as = 'link', variant, children }: ScreenLinkProps) {
  const href = useScreenHref()(artboard, state);
  return as === 'button' ? <Button href={href} variant={variant}>{children}</Button> : <Link href={href}>{children}</Link>;
}
