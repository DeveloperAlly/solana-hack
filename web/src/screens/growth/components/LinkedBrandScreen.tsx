import { createElement, type FunctionComponent } from 'react';
import type { ScreenState } from '../../../ui/composites/DemoStateSwitcher';
import { EmptyState } from '../../../ui/composites/EmptyState';
import type { RouteTag } from '../../../config/routes';
import type { BrandVariants } from '../brandData';
import { useLinkedBrand, type LinkedBrand } from '../linkedBrand';
import type { ScreenProps } from '../types';
import { PublicFrame } from './PublicFrame';

export interface LinkedBrandScreenProps<D> {
  screen: FunctionComponent<ScreenProps<D>>;
  state: ScreenState;
  tag: RouteTag;
  /** A standalone visit's data (no `?brand=`). */
  standalone: BrandVariants<D>;
  /** The data for the brand the page was opened for. */
  linked: (brand: LinkedBrand) => BrandVariants<D>;
}

/**
 * A public page resolved for the brand that linked to it (`?brand=`, linkedBrand.ts), else its standalone default. An
 * id no brand has says so; it never falls back to another brand's data (Codex review on PR 111).
 */
export function LinkedBrandScreen<D>({ screen, state, tag, standalone, linked }: LinkedBrandScreenProps<D>) {
  const lookup = useLinkedBrand();
  if (lookup.kind === 'unknown') {
    return (
      <PublicFrame title="This link points at no brand" tag={tag}>
        <EmptyState level={2} title="We don’t know this brand" body="The link may be mistyped or the brand removed. Ask whoever sent it for a new link." />
      </PublicFrame>
    );
  }
  const variants = lookup.kind === 'found' ? linked(lookup.brand) : standalone;
  const byState: Partial<Record<ScreenState, D>> = variants;
  return createElement(screen, { data: byState[state] ?? variants.success, state });
}
