import type { ReactNode } from 'react';
import type { RouteTag } from '../../config/routes';
import type { ArtboardName } from '../../config/artboards';
import { Heading, Stack, Text } from '../../ui/primitives';
import { LoopFrame } from '../../ui/shells/LoopFrame';
import { ActiveBrandSwitcher } from '../../flows/brand/ActiveBrandSwitcher';
import { useActiveBrand } from '../../flows/brand/activeBrand';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';

export interface BuilderHubPageProps {
  /** The board this screen is; its stage and tab come from config/nav.ts `navForArtboard`. */
  artboard: ArtboardName;
  title: string;
  /** Canvas tag; flagged tags (THIN, STRETCH) show a chip beside the title. */
  tag?: RouteTag;
  intro?: string;
  /** Header action, e.g. "New campaign". */
  action?: ReactNode;
  children?: ReactNode;
}

/**
 * A hub screen of this page (canvas Kit-Export, Dashboard): the loop frame (the one nav with the stage's tabs) with
 * the brand switcher, a title row with its tag chip and action, then the content.
 */
export function BuilderHubPage({ artboard, title, tag, intro, action, children }: BuilderHubPageProps) {
  const brand = useActiveBrand();
  // INTEGRATION: switching brand loads that brand's data (the account's brands; backend map §4).
  return (
    <LoopFrame artboard={artboard} brandName={brand.name} brandSlot={<ActiveBrandSwitcher />}>
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
    </LoopFrame>
  );
}
