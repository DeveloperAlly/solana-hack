/*
 * Data contract: J8-Hub-FirstRun, "Return: first-run hub + checklist" (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * board J8-Hub-FirstRun, note n-j8-hub-firstrun; issue #48). Shape: HubFirstRunData in ./types. Backend map:
 * .agentic/what/context/backend_map.md §4, rows "Content-Dashboard (and its empty state), Hub-Home" and "Ledger".
 *
 * | Field          | Source                                                                                           | Empty when |
 * |----------------|--------------------------------------------------------------------------------------------------|------------|
 * | brandName      | `brands.name`, GET /api/me (web/worker/api.ts)                                                   | never      |
 * | status         | Kit registration, first post status and readiness: GET /api/brands/:id and …/coverage            | never      |
 * | checklist[]    | Derived from brand state: kit registered, a post official, source count, drafts, ai_settings, memberships; each open item links to the screen that does it | never: the hub is never empty |
 * | nextPost       | A topic from a messaging pillar (`kit_sections` messaging), drafted on Draft-Review               | hidden when no pillar |
 * | publicRecord[] | The brand's `registrations` (kit and posts), via GET /api/ledger                                 | [] before the first registration |
 * | comingSoon     | Static copy: coming-soon areas are named, not hidden (note n-j8-hub-firstrun 4)                  | never      |
 *
 * States: success only (the board draws one state; the hub is never empty by design).
 */
import { Button, Container, Heading, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { SampleFlag } from '../../ui/composites/SampleFlag';
import { AppShell } from '../../ui/shells/AppShell';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { JourneyChecklist } from '../../ui/domain/JourneyChecklist';
import { JourneySplit } from '../../ui/domain/JourneySplit';
import { JourneyStatusList } from '../../ui/domain/JourneyStatusList';
import { hubNavHref, journeyPaths } from './paths';
import type { HubFirstRunData } from './types';

export function J8HubFirstRun({ data }: { data: HubFirstRunData }) {
  return (
    <AppShell navHref={hubNavHref}>
      <Container width="app">
        <Stack gap={6}>
          <Stack direction="row" gap={4} align="end" justify="between" wrap>
            <Stack gap={1}>
              <Heading level={1} size="2xl">Welcome, {data.brandName}</Heading>
              <Text tone="secondary">{data.status} <SampleFlag /></Text>
            </Stack>
            <Button href={journeyPaths.draftReview}>Draft post 2</Button>
          </Stack>
          <JourneySplit
            ratio="7-5"
            first={<JourneyChecklist title="Get set up" items={data.checklist} />}
            second={
              <>
                <Card labelledBy="hub-next">
                  <Heading level={2} size="lg" id="hub-next">Next best post</Heading>
                  <Text variant="small">{data.nextPost}</Text>
                  <div><Button variant="secondary" href={journeyPaths.draftReview}>Draft it</Button></div>
                </Card>
                <JourneyStatusList title="Your public record" rows={data.publicRecord} />
                <Card variant="subtle" labelledBy="hub-soon" header={<><Heading level={2} size="lg" id="hub-soon">Coming soon</Heading><ComingSoonFlag tag="COMING SOON" /></>}>
                  <Text variant="small" tone="secondary">{data.comingSoon}</Text>
                </Card>
              </>
            }
          />
        </Stack>
      </Container>
    </AppShell>
  );
}
