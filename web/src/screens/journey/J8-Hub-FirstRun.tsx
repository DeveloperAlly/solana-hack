/*
 * Data contract: J8-Hub-FirstRun, "Return: first-run hub + checklist" (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * board J8-Hub-FirstRun, note n-j8-hub-firstrun; issue #48). Shape: HubFirstRunData in ./types. Backend map:
 * .agentic/what/context/backend_map.md §4, rows "Content-Dashboard (and its empty state), Hub-Home" and "Ledger".
 *
 * | Field          | Source                                                                                           | Empty when |
 * |----------------|--------------------------------------------------------------------------------------------------|------------|
 * | brandName      | `brands.name`, GET /api/me (web/worker/api.ts)                                                   | never      |
 * | readiness      | Kit registration, first post status and readiness: GET /api/brands/:id and …/coverage            | never      |
 * | checklist[]    | Derived from brand state: kit registered, a post official, source count, drafts, ai_settings, memberships; each open item links to the screen that does it | never: the hub is never empty |
 * | nextPost       | A topic from a messaging pillar (`kit_sections` messaging), drafted on Draft-Review               | hidden when no pillar |
 * | publicRecord[] | The brand's `registrations` (kit and posts), via GET /api/ledger                                 | [] before the first registration |
 * | comingSoon     | Static copy: coming-soon areas are named, not hidden (note n-j8-hub-firstrun 4)                  | never      |
 *
 * The status line, the kit and post checklist items and the public record follow whether kit v1 and the first post
 * were registered on this visit (useJourneyFlow, derive.ts hubView); the fixture is the default.
 * States: success only (the board draws one state; the hub is never empty by design).
 */
import { Button, Container, Heading, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { SampleFlag } from '../../ui/composites/SampleFlag';
import { AppShell } from '../../ui/shells/AppShell';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { JourneyChecklist } from '../../ui/domain/JourneyChecklist';
import { StatusList } from '../../ui/composites/StatusList';
import { Columns } from '../../ui/layouts/Columns';
import { useJourneyHref, useJourneyLink, useNavHref } from './paths';
import { hubView, statusRows } from './derive';
import { useJourneyFlow } from './useJourneyFlow';
import type { HubFirstRunData } from './types';

export function J8HubFirstRun({ data }: { data: HubFirstRunData }) {
  const to = useJourneyHref();
  const link = useJourneyLink();
  const navHref = useNavHref();
  const { selections } = useJourneyFlow();
  const view = hubView(data, selections);
  return (
    <AppShell navHref={navHref} activePath={navHref('/home')}>
      <Container width="app">
        <Stack gap={6}>
          <Stack direction="row" gap={4} align="end" justify="between" wrap>
            <Stack gap={1}>
              <Heading level={1} size="2xl">Welcome, {data.brandName}</Heading>
              <Text tone="secondary">{view.status} <SampleFlag /></Text>
            </Stack>
            <Button href={to('draftReview')}>Draft post 2</Button>
          </Stack>
          <Columns
            ratio="7-5"
            stackBelow="md"
            end={
              <Stack gap={3}>
                <Card labelledBy="hub-next">
                  <Heading level={2} size="lg" id="hub-next">Next best post</Heading>
                  <Text variant="small">{data.nextPost}</Text>
                  <div><Button variant="secondary" href={to('draftReview')}>Draft it</Button></div>
                </Card>
                <StatusList label="Your public record" title surface="card" rows={statusRows(view.publicRecord.map(({ target, ...row }) => ({ ...row, href: target && link(target) })))} />
                <Card variant="subtle" labelledBy="hub-soon" header={<><Heading level={2} size="lg" id="hub-soon">Coming soon</Heading><ComingSoonFlag tag="COMING SOON" /></>}>
                  <Text variant="small" tone="secondary">{data.comingSoon}</Text>
                </Card>
              </Stack>
            }
          >
            <JourneyChecklist title="Get set up" items={view.checklist.map(({ target, ...item }) => ({ ...item, href: target && link(target) }))} />
          </Columns>
        </Stack>
      </Container>
    </AppShell>
  );
}
