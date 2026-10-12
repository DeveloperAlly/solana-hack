import { useState, type ReactNode } from 'react';
import type { RouteTag } from '../../config/routes';
import { Container, Heading, Stack, Text } from '../../ui/primitives';
import { TabNav } from '../../ui/composites/TabNav';
import { AppShell } from '../../ui/shells/AppShell';
import { BrandSwitcher } from '../../ui/domain/BrandSwitcher';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { demoBrands } from '../../ui/domain/demoBrands';

export interface BuilderHubPageProps {
  /** The active brand (demo brands, D48). */
  brandId: string;
  subnav: { label: string; items: { id: string; label: string; href: string }[]; current?: string };
  title: string;
  /** Canvas tag; flagged tags (THIN, STRETCH) show a chip beside the title. */
  tag?: RouteTag;
  intro?: string;
  /** Header action, e.g. "New campaign". */
  action?: ReactNode;
  children?: ReactNode;
}

/**
 * A hub screen of this page (canvas Kit-Export, Dashboard): AppShell with the brand switcher, the section's sub-nav, a
 * title row with its tag chip and action, then the content.
 */
export function BuilderHubPage({ brandId, subnav, title, tag, intro, action, children }: BuilderHubPageProps) {
  const [current, setCurrent] = useState(brandId);
  // INTEGRATION: switching brand reloads the screen's data for that brand (the account's brands; backend map §4).
  return (
    <AppShell brandSlot={<BrandSwitcher brands={demoBrands} currentId={current} onSelect={setCurrent} />}>
      <Container width="app">
        <Stack gap={6}>
          <TabNav label={subnav.label} items={subnav.items} value={subnav.current ?? ''} />
          <Stack direction="row" gap={4} justify="between" align="center" wrap>
            <Stack gap={2}>
              <Stack direction="row" gap={3} align="center" wrap>
                <Heading level={1} size="2xl">{title}</Heading>
                {tag && <ComingSoonFlag tag={tag} />}
              </Stack>
              {intro && <Text tone="secondary">{intro}</Text>}
            </Stack>
            {action}
          </Stack>
          {children}
        </Stack>
      </Container>
    </AppShell>
  );
}
