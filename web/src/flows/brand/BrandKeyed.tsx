import { Fragment, type ReactNode } from 'react';
import { Button, Container } from '../../ui/primitives';
import { EmptyState } from '../../ui/composites/EmptyState';
import { defaultBrandId, selectBrand, useActiveBrand } from './activeBrand';

/**
 * Mounts its children fresh whenever the active brand changes, so a transient selection made for one brand (a
 * calendar slot, an open form, a picked option) can never be applied to another (Codex review on PR #79). Wrap a whole
 * screen with it where the screen is routed (the gallery today): keying inside a page frame would miss state held
 * by the screen component above its frame. Brand-owned data that must survive the switch lives in brand-scoped stores.
 */
export function BrandKeyed({ children }: { children: ReactNode }) {
  const brand = useActiveBrand();
  // An active id the brand catalog does not hold: say so, rather than show the screen under another brand.
  if (!brand.found) {
    return (
      <Container as="main" width="reading">
        <EmptyState level={1} title="Brand not found" body="This brand is not on your account any more." actions={<Button onClick={() => selectBrand(defaultBrandId)}>Back to your brands</Button>} />
      </Container>
    );
  }
  return <Fragment key={brand.id}>{children}</Fragment>;
}
