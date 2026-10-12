import type { ReactNode } from 'react';
import type { RouteTag } from '../../../config/routes';
import type { ArtboardName } from '../../../config/artboards';
import { AppShell } from '../../../ui/shells/AppShell';
import { PageHeader } from '../../../ui/layouts/PageHeader';
import { ComingSoonFlag } from '../../../ui/domain/ComingSoonFlag';
import { Container, Stack } from '../../../ui/primitives';
import { growthArtboards, useGrowthLinks } from '../paths';
import { useActiveBrand } from '../../../flows/brand/activeBrand';
import { GrowthNav, type GrowthSection } from './GrowthNav';

/** Hub nav paths that have a gallery screen; the rest keep their live route. */
const galleryBoards: Record<string, ArtboardName> = { '/grow': growthArtboards.platforms, '/ledger': 'Ledger' };

export interface GrowthFrameProps {
  section: GrowthSection;
  title: string;
  tag: RouteTag;
  intro?: ReactNode;
  /** "Drawn, not built" line: what is missing and where it is defined. */
  meta?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}

/** The signed-in Growth page frame: hub shell on Grow, the Growth tabs, and a page header with the canvas tag. */
export function GrowthFrame({ section, title, tag, intro, meta, back, actions, children }: GrowthFrameProps) {
  const links = useGrowthLinks();
  const brand = useActiveBrand();
  const navHref = (path: string) => (galleryBoards[path] ? links.to(galleryBoards[path]) : path);
  return (
    <AppShell brandName={brand.name} navHref={navHref} activePath="/grow" subnav={<GrowthNav current={section} />}>
      <Container width="app">
        <Stack gap={6}>
          <PageHeader title={title} badges={<ComingSoonFlag tag={tag} />} intro={intro} meta={meta} back={back} actions={actions} />
          {children}
        </Stack>
      </Container>
    </AppShell>
  );
}
