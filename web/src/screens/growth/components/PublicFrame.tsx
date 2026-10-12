import type { ReactNode } from 'react';
import type { RouteTag } from '../../../config/routes';
import { PublicShell } from '../../../ui/shells/PublicShell';
import { PageHeader } from '../../../ui/layouts/PageHeader';
import { ComingSoonFlag } from '../../../ui/domain/ComingSoonFlag';
import { Container, Stack } from '../../../ui/primitives';

export interface PublicFrameProps {
  title: string;
  tag: RouteTag;
  intro?: ReactNode;
  meta?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * The one public frame for the growth page's public screens (an invited person, a badge visitor, a tipper, the events
 * board): L10 PublicShell, whose nav stays in the gallery there (ui/hooks/usePublicNavHref.ts), and a page header with
 * the canvas tag. A composition, no styles of its own.
 */
export function PublicFrame({ title, tag, intro, meta, back, actions, children }: PublicFrameProps) {
  return (
    <PublicShell>
      <Container width="app">
        <Stack gap={6}>
          <PageHeader title={title} badges={<ComingSoonFlag tag={tag} />} intro={intro} meta={meta} back={back} actions={actions} />
          {children}
        </Stack>
      </Container>
    </PublicShell>
  );
}
