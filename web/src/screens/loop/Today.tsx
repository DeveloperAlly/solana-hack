/*
 * Data contract: Today (canvas v24 page "Start here: the loop", board Today; ADR-012 decision 1, PR #86; issue #90
 * row "Today"). Shape: TodayData in ./types.ts. Replaces Hub-Home as the front door.
 *
 * | Field             | Source                                                                                         |
 * |-------------------|------------------------------------------------------------------------------------------------|
 * | weekday, status   | Client weekday; brands (domain verified), kit_versions (registered), memberships (seats)       |
 * | loop[]            | Per stage: kit and voices (Brain, X18), drafts, platforms (P7), registrations, campaigns and   |
 * |                   | events, results (N1 to N5). One endpoint is not built yet: GET /api/today (not built)          |
 * | queue[]           | The union in domain/queue.ts: drafts and replies (GET /api/posts?status=drafted, built for     |
 * |                   | posts only), ambassador posts, event content, learned rules (N5), campaign decisions: not built |
 * | brain, proposals  | X18 brand memory and the N5 learn loop (ADR-013, PR #88): not built; fixtures                  |
 * | done, learned,    | Activity since yesterday, the latest learn finding, the calendar, badge traffic: not built     |
 * | next, proof       |                                                                                                |
 *
 * States (canvas Today note): success (the queue), empty (all clear: what's next), loading, error (per section:
 * the queue fails, the rest still shows). First run is Journey J8 (board J8-Hub-FirstRun).
 */
import { Button, Heading, Link, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { StateView } from '../../ui/composites/StateView';
import { StatusTimeline } from '../../ui/composites/StatusTimeline';
import { Columns } from '../../ui/layouts/Columns';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { SampleFlag } from '../../ui/composites/SampleFlag';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { LoopFrame } from '../../ui/shells/LoopFrame';
import { TodayAside } from './TodayAside';
import { TodayQueue } from './TodayQueue';
import { useLoopLinks } from './paths';
import { useToday } from './useToday';
import type { TodayData } from './types';

export function Today({ data, state = 'success' }: { data: TodayData; state?: ScreenState }) {
  const t = useToday(data);
  const { to } = useLoopLinks();
  const steps = t.steps.map((s) => ({ ...s, action: <Link href={to(s.href.artboard)}>{s.href.label}</Link> }));
  return (
    <LoopFrame artboard="Today" tag="COMING SOON" brandName={data.brain.brandName}>
      <PageHeader
        title={`${data.weekday}, ${data.brain.brandName}`}
        intro={<>{data.status} · <SampleFlag /></>}
        actions={t.needsYou.length > 0 && <Button href="#queue">Clear {t.needsYou.length} decisions</Button>}
      />
      <Card labelledBy="loop-h" header={<><Heading level={2} size="lg" id="loop-h">Where {data.brain.brandName} is in the loop</Heading><Text as="span" variant="small" tone="secondary">{t.progress} · {data.loopNote}</Text></>}>
        <StatusTimeline steps={steps} label="Loop steps" />
      </Card>
      <Columns end={<TodayAside data={data} />}>
        <StateView
          state={state}
          loading={{ title: 'Loading your decisions', body: 'Drafts, replies and suggestions are on their way.' }}
          error={{ title: "Couldn't load your decisions", body: 'The rest of Today is up to date. Nothing was approved or sent.', actions: <Button variant="secondary" href={to('Today')}>Try again</Button> }}
        >
          <TodayQueue rows={t.shown} pending={t.needsYou.length} done={t.done} filter={{ value: t.filter, onChange: t.setFilter }} />
        </StateView>
      </Columns>
    </LoopFrame>
  );
}

