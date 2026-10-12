import type { ReactElement } from 'react';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import type { ArtboardName } from '../../config/artboards';
import { useActiveBrand } from '../../flows/brand/activeBrand';
import { EmptyState } from '../../ui/composites/EmptyState';
import { LoopFrame } from '../../ui/shells/LoopFrame';
import { loopDataFor, type LoopBrandData } from './fixtures';

export interface ActiveBrandLoopProps {
  /** The board, for the frame of the "no data yet" state. */
  artboard: ArtboardName;
  /** Renders the screen from the active brand's loop data; null when the brand has no data for this screen yet. */
  view: (data: LoopBrandData) => ReactElement | null;
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
  const screen = data ? view(data) : null;
  if (screen) return screen;
  return (
    <LoopFrame artboard={artboard} tag="COMING SOON" brandName={brand.name}>
      <EmptyState level={1} title={`Nothing here for ${brand.name} yet`} body={data ? 'This brand has nothing on this screen yet: it comes with its first approved post or event.' : 'This demo has sample data for aDNA, JamJam and GamersLab. Switch brand to see one of them.'} />
    </LoopFrame>
  );
}

/**
 * The state a screen shows: the demo state asked for, except that "success" on data with nothing in it is the empty
 * state, so a first-run brand never sees a success layout with zero data (Codex review on PR 111). Loading and error
 * are shown as asked. Every brand-scoped registry (loop, growth) uses it.
 */
export const resolveState = (requested: ScreenState, isEmpty: boolean): ScreenState => (requested === 'success' && isEmpty ? 'empty' : requested);
