import type { ReactNode } from 'react';
import { AppShell } from '../../../ui/shells/AppShell';
import { TabNav } from '../../../ui/composites/TabNav';
import { BrandSwitcher } from '../../../ui/domain/BrandSwitcher';
import { demoBrands } from '../../../ui/domain/demoBrands';
import { Container, Stack } from '../../../ui/primitives';
import { useHubLinks, type HubLink } from '../paths';
import { hubSubnav, hubTopNav, sectionLink, type HubSection } from './hubNav';
import { useActiveBrand } from '../hooks/useHubSession';

export interface HubPageProps {
  section: HubSection;
  /** Current second-level tab id (Brand, Create, Grow). */
  sub?: string;
  /** Wizard screens use the narrower container. */
  width?: 'app' | 'wizard';
  children: ReactNode;
}

/**
 * The Superhub frame for every screen on this page: L1 AppShell with the canvas top nav (nav paths are link keys that
 * `navHref` turns into gallery screen paths; the logo's /home goes to Hub-Home), the brand switcher (D48; the choice is
 * kept for every later screen), the section's sub-tabs, and the content container. Sign out is inert in the gallery.
 */
export function HubPage({ section, sub, width = 'app', children }: HubPageProps) {
  const links = useHubLinks();
  const brand = useActiveBrand();
  const subnav = hubSubnav[section];
  const navHref = (path: string) => (path === '/home' ? links.home : links[path as HubLink]);
  return (
    <AppShell
      nav={hubTopNav.map((n) => ({ path: n.link, label: n.label, tag: n.tag }))}
      navHref={navHref}
      activePath={sectionLink[section]}
      brandName={brand.name}
      brandSlot={<BrandSwitcher brands={demoBrands} currentId={brand.id} onSelect={brand.select} />}
      subnav={subnav && <TabNav label={subnav.label} items={subnav.items.map((i) => ({ ...i, href: links[i.link] }))} value={sub ?? ''} />}
    >
      <Container width={width}>
        <Stack gap={6}>{children}</Stack>
      </Container>
    </AppShell>
  );
}
