import type { ReactNode } from 'react';
import type { RouteTag } from '../../../config/routes';
import { PublicShell } from '../../../ui/shells/PublicShell';
import { PageHeader } from '../../../ui/layouts/PageHeader';
import { ComingSoonFlag } from '../../../ui/domain/ComingSoonFlag';
import { Container, Stack } from '../../../ui/primitives';

export interface GrowthPublicFrameProps {
  title: string;
  tag: RouteTag;
  intro?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
}

/** The public Growth frame (what an invited person or a badge visitor sees): public nav, header with the canvas tag. */
export function GrowthPublicFrame({ title, tag, intro, meta, children }: GrowthPublicFrameProps) {
  return (
    <PublicShell>
      <Container width="app">
        <Stack gap={6}>
          <PageHeader title={title} badges={<ComingSoonFlag tag={tag} />} intro={intro} meta={meta} />
          {children}
        </Stack>
      </Container>
    </PublicShell>
  );
}
