import type { ReactElement } from 'react';
import type { ArtboardName } from '../../config/artboards';
import { useActiveBrand } from '../../flows/brand/activeBrand';
import { EmptyState } from '../../ui/composites/EmptyState';
import { LoopFrame } from '../../ui/shells/LoopFrame';
import { loopDataFor, type LoopBrandData } from './fixtures';

export interface ActiveBrandLoopProps {
  /** The board, for the frame of the "no data yet" state. */
  artboard: ArtboardName;
  /** Renders the screen from the active brand's loop data. */
  view: (data: LoopBrandData) => ReactElement;
}

/**
 * Resolves the loop screens' data from the one active brand (flows/brand), the same brand the loop store is keyed by,
 * so a screen never shows one brand's data while writing another's state (Codex review on PR 111). A brand with no
 * loop data yet gets an explicit empty state, never another brand's data.
 * INTEGRATION: GET the brand's Brain, queue, posts and registrations (X18, N5, posts, ledger; not built).
 */
export function ActiveBrandLoop({ artboard, view }: ActiveBrandLoopProps) {
  const brand = useActiveBrand();
  const data = loopDataFor(brand.id);
  if (data) return view(data);
  return (
    <LoopFrame artboard={artboard} tag="COMING SOON" brandName={brand.name}>
      <EmptyState level={1} title={`No loop data for ${brand.name} yet`} body="This demo has sample loop data for aDNA, JamJam and GamersLab. Switch brand to see one of them." />
    </LoopFrame>
  );
}
