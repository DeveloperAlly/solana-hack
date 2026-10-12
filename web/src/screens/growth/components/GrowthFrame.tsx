import type { ReactNode } from 'react';
import type { RouteTag } from '../../../config/routes';
import type { ArtboardName } from '../../../config/artboards';
import { LoopFrame } from '../../../ui/shells/LoopFrame';
import { ComingSoonFlag } from '../../../ui/domain/ComingSoonFlag';
import { useActiveBrand } from '../../../flows/brand/activeBrand';

export interface GrowthFrameProps {
  /** The board this screen is; its stage and tab come from config/nav.ts `navForArtboard`. */
  artboard: ArtboardName;
  /** The board whose tab is current, when the canvas draws this one under another. */
  under?: ArtboardName;
  title: string;
  tag: RouteTag;
  intro?: ReactNode;
  /** "Drawn, not built" line: what is missing and where it is defined. */
  meta?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}

/** The signed-in Growth page frame: the loop frame on the board's own stage and tab, with a page header and the canvas tag. */
export function GrowthFrame({ artboard, under, title, tag, intro, meta, back, actions, children }: GrowthFrameProps) {
  const brand = useActiveBrand();
  return (
    <LoopFrame artboard={artboard} under={under} brandName={brand.name} header={{ title, badges: <ComingSoonFlag tag={tag} />, intro, meta, back, actions }}>
      {children}
    </LoopFrame>
  );
}
