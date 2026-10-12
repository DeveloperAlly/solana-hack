import { useId } from 'react';
import type { Platform } from '../../../config/platforms';
import { Badge, Heading, Link, Stack } from '../../../ui/primitives';
import { List, ListRow } from '../../../ui/composites/ListRow';
import { platformPlansLine, platformStatusChip } from '../platformStatus';
import { useGrowthLinks } from '../paths';
import type { ConnectionState } from '../types';

export interface GrowthPlatformGroupProps {
  label: string;
  platforms: Platform[];
  connections: Record<string, ConnectionState>;
}

/** One kind of platform (Social, Video …): a heading and a row per platform with its plans, status and a details link. */
export function GrowthPlatformGroup({ label, platforms, connections }: GrowthPlatformGroupProps) {
  const links = useGrowthLinks();
  const headingId = useId();
  return (
    <Stack as="section" gap={2} aria-labelledby={headingId}>
      <Heading level={2} size="lg" id={headingId}>{label}</Heading>
      <List label={`${label} platforms`}>
        {platforms.map((p) => (
          <ListRow
            key={p.id}
            title={<Link href={links.platform(p.id)}>{p.name}</Link>}
            detail={`${platformPlansLine(p)}. Connect: ${p.connect}.`}
            aside={connections[p.id] === 'connected' ? <Badge>Connected (preview)</Badge> : undefined}
            status={platformStatusChip(p)}
          />
        ))}
      </List>
    </Stack>
  );
}
