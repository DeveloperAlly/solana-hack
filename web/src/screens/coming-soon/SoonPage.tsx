import type { ReactNode } from 'react';
import type { RouteTag } from '../../config/routes';
import type { ArtboardName } from '../../config/artboards';
import { LoopFrame } from '../../ui/shells/LoopFrame';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { ActiveBrandSwitcher } from '../../flows/brand/ActiveBrandSwitcher';
import { useActiveBrand } from '../../flows/brand/activeBrand';

export interface SoonHeader {
  title: string;
  intro?: ReactNode;
  /** The canvas "Drawn, not built. Defined in: …" line. */
  definedIn?: string;
  actions?: ReactNode;
  tag?: RouteTag;
}

export interface SoonPageProps {
  /** The board this screen is; its stage and tab come from config/nav.ts `navForArtboard`. */
  artboard: ArtboardName;
  header: SoonHeader;
  children?: ReactNode;
}

/**
 * This page's hub frame, a page composition (screens/README.md, "Shared components"): the loop frame (L1 AppShell on
 * the one nav; ADR-012) with the D48 brand switcher, then L5 PageHeader with the Coming soon flag. The brand chosen
 * here or on Brand-Switcher is the app-wide active brand, and brands added on Brand-Switcher join the brand catalog
 * (flows/brand).
 */
export function SoonPage({ artboard, header, children }: SoonPageProps) {
  const brand = useActiveBrand();
  const { title, intro, definedIn, actions, tag = 'COMING SOON' } = header;
  return (
    <LoopFrame
      artboard={artboard}
      brandName={brand.name}
      brandSlot={<ActiveBrandSwitcher />}
      header={{ title, intro, actions, badges: <ComingSoonFlag tag={tag} />, meta: definedIn && `Drawn, not built. Defined in: ${definedIn}` }}
    >
      {children}
    </LoopFrame>
  );
}
