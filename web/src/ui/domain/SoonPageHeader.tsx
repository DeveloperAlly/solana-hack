import type { ReactNode } from 'react';
import type { RouteTag } from '../../config/routes';
import { Heading, Stack, Text } from '../primitives';
import type { HeadingLevel } from '../primitives/Heading';
import { ComingSoonFlag } from './ComingSoonFlag';

export interface SoonPageHeaderProps {
  title: string;
  /** Canvas tag of the screen; COMING SOON and ROADMAP render the flag, HACKATHON renders none. */
  tag?: RouteTag;
  intro?: ReactNode;
  /** Where the screen is defined (the canvas "Drawn, not built. Defined in: …" line). */
  definedIn?: string;
  /** Actions beside the title, e.g. a Back link. */
  actions?: ReactNode;
  /** Heading level of the title: 1 on a screen (default), lower when previewed inside another page. */
  titleLevel?: HeadingLevel;
}

/** Page header for drawn-not-built screens (canvas "Coming soon" page): title, flag, intro and the defined-in line. */
export function SoonPageHeader({ title, tag = 'COMING SOON', intro, definedIn, actions, titleLevel = 1 }: SoonPageHeaderProps) {
  return (
    <Stack gap={2}>
      <Stack direction="row" gap={3} align="center" justify="between" wrap>
        <Stack direction="row" gap={3} align="center" wrap>
          <Heading level={titleLevel} size="2xl">{title}</Heading>
          <ComingSoonFlag tag={tag} />
        </Stack>
        {actions}
      </Stack>
      {intro && <Text tone="secondary">{intro}</Text>}
      {definedIn && <Text variant="caption" tone="secondary">Drawn, not built. Defined in: {definedIn}</Text>}
    </Stack>
  );
}
