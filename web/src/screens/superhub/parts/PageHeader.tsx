import type { ReactNode } from 'react';
import type { RouteTag } from '../../../config/routes';
import { SampleFlag } from '../../../ui/composites/SampleFlag';
import { ComingSoonFlag } from '../../../ui/domain/ComingSoonFlag';
import { Heading, Link, Stack, Text } from '../../../ui/primitives';

export interface PageHeaderProps {
  title: string;
  intro?: ReactNode;
  back?: { href: string; label: string };
  /** Canvas board tag; tags with a chip (Stretch, Roadmap, Experimental…) show it next to the title. */
  tag?: RouteTag;
  sample?: boolean;
  actions?: ReactNode;
}

/** Screen title block: optional back link, h1 with tag and sample-data chips, intro, and header actions. */
export function PageHeader({ title, intro, back, tag, sample, actions }: PageHeaderProps) {
  return (
    <Stack direction="row" gap={4} align="end" justify="between" wrap>
      <Stack gap={2}>
        {back && <Text variant="small"><Link href={back.href}>{back.label}</Link></Text>}
        <Stack direction="row" gap={3} align="center" wrap>
          <Heading level={1} size="2xl">{title}</Heading>
          {tag && <ComingSoonFlag tag={tag} />}
          {sample && <SampleFlag />}
        </Stack>
        {intro && <Text tone="secondary">{intro}</Text>}
      </Stack>
      {actions && <Stack direction="row" gap={2} wrap>{actions}</Stack>}
    </Stack>
  );
}
