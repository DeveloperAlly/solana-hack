import type { ReactNode } from 'react';
import type { RouteTag } from '../../../config/routes';
import type { StageId } from '../../../config/nav';
import { AppShell } from '../../../ui/shells/AppShell';
import { PageHeader } from '../../../ui/layouts/PageHeader';
import { ComingSoonFlag } from '../../../ui/domain/ComingSoonFlag';
import { Container, Stack } from '../../../ui/primitives';

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

/** A signed-in loop screen: the loop shell on its stage and tab, a page header with the canvas tag. */
export function LoopFrame({ stage, tab, title, tag, intro, meta, back, actions, children }: LoopFrameProps) {
  return (
    <AppShell stage={stage} tab={tab} brandName="aDNA">
      <Container width="app">
        <Stack gap={6}>
          <PageHeader title={title} badges={<ComingSoonFlag tag={tag} />} intro={intro} meta={meta} back={back} actions={actions} />
          {children}
        </Stack>
      </Container>
    </AppShell>
  );
}
