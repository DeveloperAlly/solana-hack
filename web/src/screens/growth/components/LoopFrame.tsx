import type { ReactNode } from 'react';
import type { RouteTag } from '../../../config/routes';
import type { StageId } from '../../../config/nav';
import { PageHeader } from '../../../ui/layouts/PageHeader';
import { LoopPage } from '../../loop/LoopPage';

export interface LoopFrameProps {
  /** Loop stage and tab from config/nav.ts (ADR-012: one navigation). */
  stage: StageId;
  tab: string;
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
 * A signed-in loop screen on the growth page: the loop screens' frame (screens/loop LoopPage: the one nav, the brand
 * chip, the canvas tag in the bar) with a page header. A composition, no styles of its own.
 */
export function LoopFrame({ stage, tab, title, tag, intro, meta, back, actions, children }: LoopFrameProps) {
  return (
    <LoopPage stage={stage} tab={tab} brandName="aDNA" tag={tag}>
      <PageHeader title={title} intro={intro} meta={meta} back={back} actions={actions} />
      {children}
    </LoopPage>
  );
}
