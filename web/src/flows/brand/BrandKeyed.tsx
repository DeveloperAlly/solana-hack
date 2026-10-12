import { Fragment, type ReactNode } from 'react';
import { activeBrand } from './activeBrand';

/**
 * Mounts its children fresh whenever the active brand changes, so a transient selection made for one brand (a
 * calendar slot, an open form, a picked option) can never be applied to another (Codex review on PR #79). Wrap a whole
 * screen with it where the screen is routed (the gallery today): keying inside a page frame would miss state held
 * by the screen component above its frame. Brand-owned data that must survive the switch lives in brand-scoped stores.
 */
export function BrandKeyed({ children }: { children: ReactNode }) {
  return <Fragment key={activeBrand.use()}>{children}</Fragment>;
}
