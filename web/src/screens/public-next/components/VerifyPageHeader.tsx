import type { ReactNode } from 'react';
import type { RouteTag } from '../../../config/routes';
import { Heading, Stack, Text } from '../../../ui/primitives';
import { ComingSoonFlag } from '../../../ui/domain/ComingSoonFlag';

export interface VerifyPageHeaderProps {
  title: string;
  /** Canvas tag; coming-soon and roadmap tags show the flag next to the title. */
  tag: RouteTag;
  intro?: string;
  /** Canvas "proto" note: what is not built yet and where it is defined. */
  note?: string;
  /** Right-hand control (the Ledger brand switcher). */
  aside?: ReactNode;
}

/** Page heading for the Verify and Ledger screens: title with its tag flag, intro line, build note and an aside slot. */
export function VerifyPageHeader({ title, tag, intro, note, aside }: VerifyPageHeaderProps) {
  return (
    <Stack direction="row" gap={4} align="end" justify="between" wrap>
      <Stack gap={2}>
        <Stack direction="row" gap={3} align="center" wrap>
          <Heading level={1} size="2xl">{title}</Heading>
          <ComingSoonFlag tag={tag} />
        </Stack>
        {intro && <Text tone="secondary">{intro}</Text>}
        {note && <Text variant="small" tone="secondary">{note}</Text>}
      </Stack>
      {aside}
    </Stack>
  );
}
