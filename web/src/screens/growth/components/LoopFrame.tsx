import type { ReactNode } from 'react';
import type { RouteTag } from '../../../config/routes';
import type { ArtboardName } from '../../../config/artboards';
import { navForArtboard } from '../../../config/boardNav';
import { PageHeader } from '../../../ui/layouts/PageHeader';
import { LoopPage } from '../../loop/LoopPage';

export interface LoopFrameProps {
  /** The board this screen is; its stage comes from its home (config/boardNav.ts), never from the frame. */
  artboard: ArtboardName;
  /** The board whose tab is current, when this board is not a tab itself (Platform-Detail under Platforms). */
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

/**
 * A signed-in screen on the growth page: the loop screens' frame (screens/loop LoopPage: the one nav, the brand chip,
 * the canvas tag in the bar) on the board's own stage and tab, with a page header. A composition, no styles of its own.
 */
export function LoopFrame({ artboard, under, title, tag, intro, meta, back, actions, children }: LoopFrameProps) {
  const { stage, tab } = navForArtboard(artboard, under);
  return (
    <LoopPage stage={stage} tab={tab} brandName="aDNA" tag={tag}>
      <PageHeader title={title} intro={intro} meta={meta} back={back} actions={actions} />
      {children}
    </LoopPage>
  );
}
