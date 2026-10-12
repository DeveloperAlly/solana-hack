/*
 * Data contract: Hub-Home (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Hub-Home,
 * note n-hub). Shape: HubHomeData in ./types.ts.
 *
 * | Field        | Source (backend map §4, row "Content-Dashboard (and its empty state), Hub-Home" unless noted)            |
 * |--------------|----------------------------------------------------------------------------------------------------------|
 * | weekday      | Client: today's weekday; the title adds the brand chosen in the switcher (hub session)                   |
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
import { Button, Grid, Heading, Link } from '../../ui/primitives';
import { Badge } from '../../ui/primitives/Badge';
import { Card } from '../../ui/composites/Card';
import { StatTile } from '../../ui/composites/StatTile';
import { List, ListRow } from '../../ui/composites/ListRow';
import { Columns } from '../../ui/layouts/Columns';
import { HubPage } from './parts/HubPage';
import { PageHeader } from '../../ui/layouts/PageHeader';


import { HomeAside } from './parts/HomeAside';
import { useActiveBrand } from './hooks/useHubSession';
import { useHubLinks } from './paths';
import type { HubHomeData } from './types';

export function HubHome({ data }: { data: HubHomeData }) {
  const links = useHubLinks();
  const brand = useActiveBrand();
  return (
    <HubPage section="home">
      <PageHeader title={`${data.weekday}, ${brand.name}`} intro={data.status} actions={<Button href={links.content}>Review {data.reviewCount} items</Button>} />
      <Grid min="sm" gap={4}>
        {data.kpis.map((k) => <StatTile key={k.label} {...k} href={k.href && links[k.href]} />)}
      </Grid>
      <Columns end={<HomeAside data={data} />}>
        <Card labelledBy="hub-needs" header={<><Heading level={2} size="lg" id="hub-needs">Needs you next</Heading><Link href={links.content}>All</Link></>}>
          <List label="Needs you next">
            {data.needs.map((n) => (
              <ListRow key={n.id} lead={<Badge>{n.chip}</Badge>} title={n.text} actions={<Button variant="secondary" href={links[n.href]}>Review</Button>} />
            ))}
          </List>
        </Card>
      </Columns>
    </HubPage>
  );
}
