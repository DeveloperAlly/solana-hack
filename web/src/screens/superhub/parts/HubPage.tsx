import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { AppShell } from '../../../ui/shells/AppShell';
import { TabNav } from '../../../ui/composites/TabNav';
import { BrandSwitcher } from '../../../ui/domain/BrandSwitcher';
import { demoBrands } from '../../../ui/domain/demoBrands';
import { Container, Stack } from '../../../ui/primitives';
import { paths } from '../paths';
import { hubSubnav, hubTopNav, sectionPath, type HubSection } from './hubNav';

export interface HubPageProps {
  section: HubSection;
  /** Current second-level tab id (Brand, Create, Grow). */
  sub?: string;
  /** Wizard screens use the narrower container. */
  width?: 'app' | 'wizard';
  children: ReactNode;
}

/**
 * The Superhub frame for every screen on this page: L1 AppShell with the canvas top nav, the brand switcher (D48),
 * the section's sub-tabs, and the content container. Sign out goes back to the landing artboard (no auth here).
 */
export function HubPage({ section, sub, width = 'app', children }: HubPageProps) {
  const navigate = useNavigate();
  const [brand, setBrand] = useState('adna');
  const subnav = hubSubnav[section];
  return (
    <AppShell
      nav={hubTopNav}
      homeHref={paths.home}
      activePath={sectionPath[section]}
      brandSlot={<BrandSwitcher brands={demoBrands} currentId={brand} onSelect={setBrand} />}
      subnav={subnav && <TabNav label={subnav.label} items={subnav.items} value={sub ?? ''} />}
      onSignOut={() => navigate(paths.main)}
    >
      <Container width={width}>
        <Stack gap={6}>{children}</Stack>
      </Container>
    </AppShell>
  );
}
