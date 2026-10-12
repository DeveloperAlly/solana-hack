import type { ReactNode } from 'react';
import type { ArtboardName } from '../../../config/artboards';
import { LoopFrame } from '../../../ui/shells/LoopFrame';
import { useActiveBrand } from '../../../flows/brand/activeBrand';
import { ActiveBrandSwitcher } from '../../../flows/brand/ActiveBrandSwitcher';

export interface HubPageProps {
  /** The board this screen is; its stage and tab come from config/nav.ts `navForArtboard`. */
  artboard: ArtboardName;
  /** Wizard screens use the narrower container. */
  width?: 'app' | 'wizard';
  children: ReactNode;
}

/**
 * The Superhub frame for every screen on this page: the loop frame (L1 AppShell on the one nav; ADR-012) with the
 * brand switcher (D48; the choice is kept for every later screen). Sign out is inert in the gallery.
 */
export function HubPage({ artboard, width = 'app', children }: HubPageProps) {
  const brand = useActiveBrand();
  return <LoopFrame artboard={artboard} container={width} brandName={brand.name} brandSlot={<ActiveBrandSwitcher />}>{children}</LoopFrame>;
}
