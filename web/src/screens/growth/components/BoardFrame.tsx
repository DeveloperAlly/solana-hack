import type { ReactNode } from 'react';
import type { ArtboardName } from '../../../config/artboards';
import { PublicShell } from '../../../ui/shells/PublicShell';
import { PageHeader } from '../../../ui/layouts/PageHeader';
import { ComingSoonFlag } from '../../../ui/domain/ComingSoonFlag';
import { Container, Stack } from '../../../ui/primitives';
import { useGrowthLinks } from '../paths';

/** Public nav paths that have a gallery screen; the rest keep their live route. */
const publicBoards: Record<string, ArtboardName> = { '/': 'Main', '/verify': 'Verify-1-Match', '/ledger': 'Ledger', '/sign-in': 'Onboard-1-SignIn' };

export interface BoardFrameProps {
  title: string;
  intro?: ReactNode;
  meta?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * The public events board frame (canvas v21 Events-Board and Event-Rating, ROADMAP): the public shell, whose home is
 * Grow (canvas v22 puts both boards on the Grow page), and a header with the ROADMAP tag.
 */
export function BoardFrame({ title, intro, meta, back, actions, children }: BoardFrameProps) {
  const links = useGrowthLinks();
  const navHref = (path: string) => (publicBoards[path] ? links.to(publicBoards[path]) : path);
  return (
    <PublicShell navHref={navHref}>
      <Container width="app">
        <Stack gap={6}>
          <PageHeader title={title} badges={<ComingSoonFlag tag="ROADMAP" />} intro={intro} meta={meta} back={back} actions={actions} />
          {children}
        </Stack>
      </Container>
    </PublicShell>
  );
}
