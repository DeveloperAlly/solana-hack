/*
 * Data contract: Hub-Home (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Hub-Home,
 * note n-hub). Shape: HubHomeData in ./types.ts.
 *
 * | Field        | Source (backend map §4, row "Content-Dashboard (and its empty state), Hub-Home" unless noted)            |
 * |--------------|----------------------------------------------------------------------------------------------------------|
 * | greeting     | Client: weekday + active brand name (brands)                                                             |
 * | status       | brands (domain verified), voices count, memberships (seats); plan from `GET …/plan` (row Settings › Plan) |
 * | reviewCount  | Sum of the queues below                                                                                  |
 * | kpis         | `GET …/drafts?status=` counts; replies `GET …/replies` (Grow, Engage-Queue); ambassador posts            |
 * |              | `GET …/ambassadors` (Grow, Dashboard); scheduled = drafts with a slot today                              |
 * | needs        | Merge of inbox (inbox_threads), drafts, replies and ambassador approvals, oldest risk first (n-hub 2)    |
 * | campaign     | campaigns: main success metric and budget (Create, Campaign-v2 row; Grow, Dashboard)                     |
 * | brandPack    | `GET …/kit/current` section states (Brand Builder, Brand-Build row)                                      |
 * | week         | metrics (Roadmap, Analytics): sample data until analytics exist                                          |
 *
 * Empty: a new brand has no queues; the first-run hub is Journey J8 (page #48). States drawn: success only.
 */
import { Button, Grid, Heading, Link, Stack, Text } from '../../ui/primitives';
import { Badge } from '../../ui/primitives/Badge';
import { Card } from '../../ui/composites/Card';
import { StatTile } from '../../ui/composites/StatTile';
import { HubItemRow } from '../../ui/domain/HubItemRow';
import { HubColumns } from '../../ui/domain/HubColumns';
import { HubPage } from './parts/HubPage';
import { PageHeader } from './parts/PageHeader';
import { HomeAside } from './parts/HomeAside';
import { useHubLinks } from './paths';
import type { HubHomeData } from './types';

export function HubHome({ data }: { data: HubHomeData }) {
  const links = useHubLinks();
  return (
    <HubPage section="home">
      <PageHeader title={data.greeting} intro={data.status} actions={<Button href={links.content}>Review {data.reviewCount} items</Button>} />
      <Grid min="sm" gap={4}>
        {data.kpis.map((k) => <StatTile key={k.label} {...k} href={k.href && links[k.href]} />)}
      </Grid>
      <HubColumns end={<HomeAside data={data} />}>
        <Card labelledBy="hub-needs" header={<><Heading level={2} size="lg" id="hub-needs">Needs you next</Heading><Link href={links.content}>All</Link></>}>
          <Stack as="ul" gap={0}>
            {data.needs.map((n) => (
              <HubItemRow key={n.id} as="li" lead={<Badge>{n.chip}</Badge>} actions={<Button variant="secondary" href={links[n.href]}>Review</Button>}>
                <Text>{n.text}</Text>
              </HubItemRow>
            ))}
          </Stack>
        </Card>
      </HubColumns>
    </HubPage>
  );
}
