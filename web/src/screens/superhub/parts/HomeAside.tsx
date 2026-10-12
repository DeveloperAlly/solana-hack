import { Button, Heading, Link, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { SampleFlag } from '../../../ui/composites/SampleFlag';
import { HubBarList } from '../../../ui/domain/HubBarList';
import { paths } from '../paths';
import type { HubHomeData } from '../types';

/** Hub-Home right column: campaign progress (main metric, n-hub 3), brand pack completeness, this week's snapshot. */
export function HomeAside({ data }: { data: HubHomeData }) {
  const { campaign, brandPack, week } = data;
  return (
    <Stack as="aside" gap={4} aria-label="Campaign, brand pack and this week">
      <Card labelledBy="hub-campaign" header={<Heading level={2} size="lg" id="hub-campaign">{campaign.name}</Heading>}>
        <Text variant="small">{campaign.goal}</Text>
        <HubBarList label="Campaign progress" hideLabels max={campaign.target} items={[{ label: 'Verified posts', value: campaign.done, display: `${campaign.done} of ${campaign.target}` }]} />
        <Text variant="small" tone="secondary">{campaign.caption}</Text>
        <Text variant="small"><Link href={paths.campaignMeasure}>Campaign details</Link></Text>
      </Card>
      <Card labelledBy="hub-pack" header={<Heading level={2} size="lg" id="hub-pack">{brandPack.title}</Heading>}>
        <Text variant="small" tone="secondary">{brandPack.missing}</Text>
        <Button variant="secondary" href={paths.brandBuild}>Finish your brand</Button>
      </Card>
      <Card variant="subtle" labelledBy="hub-week" header={<><Heading level={2} size="lg" id="hub-week">This week</Heading><SampleFlag /></>}>
        <Text variant="small"><strong>Best:</strong> {week.best}</Text>
        <Text variant="small"><strong>Weakest:</strong> {week.weakest}</Text>
        <Text variant="small"><Link href={paths.analytics}>Open analytics</Link></Text>
      </Card>
    </Stack>
  );
}
