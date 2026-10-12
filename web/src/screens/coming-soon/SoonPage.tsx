import type { ReactNode } from 'react';
import type { RouteTag } from '../../config/routes';
import { Container, Stack } from '../../ui/primitives';
import { AppShell } from '../../ui/shells/AppShell';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { BrandSwitcher } from '../../ui/domain/BrandSwitcher';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { demoBrands } from '../../ui/domain/demoBrands';
import { useActiveBrandId } from '../../flows/brand/activeBrand';
import { useSoonSession } from './useSoonSession';

export interface SoonHeader {
  title: string;
  intro?: ReactNode;
  /** The canvas "Drawn, not built. Defined in: …" line. */
  definedIn?: string;
  actions?: ReactNode;
  tag?: RouteTag;
}

export interface SoonPageProps {
  header: SoonHeader;
  /** Section nav under the header, e.g. the Settings tabs. */
  nav?: ReactNode;
  children?: ReactNode;
}

/**
 * This page's hub frame, a page composition (screens/README.md, "Shared components"): L1 AppShell with the D48
 * brand switcher, then L5 PageHeader with the Coming soon flag. The brand chosen here or on Brand-Switcher lives in
 * the session, so it carries across every screen; brands added on Brand-Switcher appear in the switcher.
 */
export function SoonPage({ header, nav, children }: SoonPageProps) {
  const [session] = useSoonSession();
  const [brandId, selectBrand] = useActiveBrandId();
  const brands = [...demoBrands, ...(session.addedBrands ?? []).map((b) => ({ id: b.id, name: b.name }))];
  const { title, intro, definedIn, actions, tag = 'COMING SOON' } = header;
  return (
    <AppShell brandSlot={<BrandSwitcher brands={brands} currentId={brandId} onSelect={selectBrand} />}>
      <Container width="app">
        <Stack gap={6}>
          <PageHeader title={title} intro={intro} actions={actions} badges={<ComingSoonFlag tag={tag} />} meta={definedIn && `Drawn, not built. Defined in: ${definedIn}`} />
          {nav}
          {children}
        </Stack>
      </Container>
    </AppShell>
  );
}
