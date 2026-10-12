import { useId } from 'react';
import { Choice, Heading, Select, Stack } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { growthBadgeStyles } from '../../../ui/domain/GrowthCheckBadge';
import type { BadgeEmbedFlow } from '../useBadge';
import type { ApprovedPost, BadgeStyle } from '../types';

/** Which registered post the badge points at, and its style. The post starts unpicked. */
export function GrowthBadgeOptions({ posts, flow }: { posts: ApprovedPost[]; flow: BadgeEmbedFlow }) {
  const headingId = useId();
  const options = [{ value: '', label: 'Choose a post' }, ...posts.map((p) => ({ value: p.id, label: `${p.brand.name} · ${p.label}` }))];
  return (
    <Card labelledBy={headingId} header={<Heading level={2} size="lg" id={headingId}>Badge options</Heading>}>
      <Stack gap={4}>
        <Select label="Post" hint="Only registered posts can carry the badge." options={options} value={flow.post?.id ?? ''} onValueChange={flow.choosePost} />
        <Choice legend="Style" options={growthBadgeStyles.map((s) => ({ value: s.id, label: s.label }))} value={flow.style} onChange={(v) => flow.chooseStyle(v as BadgeStyle)} />
      </Stack>
    </Card>
  );
}
