/*
 * Data contract: Content-Dashboard and Content-Dashboard-Empty (issue #52; canvas
 * https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Content-Dashboard and Content-Dashboard-Empty, notes n-cd
 * and n-cde). Shape: ContentDashboardData in ./types.ts. Backend map §4 Create, row "Content-Dashboard (and its empty
 * state), Hub-Home": `GET …/drafts?status=&channel=` (table drafts).
 *
 * | Field        | Source                                                                                          |
 * |--------------|-------------------------------------------------------------------------------------------------|
 * | pipeline     | The DraftWorkflow stages (n-cd 1): Writer, Brand Guard, Slop check, You, Scheduled or posted     |
 * | tabs         | Draft counts per status; Replies counts `GET …/replies` (Grow, row "Engage-Queue")              |
 * | channels     | Channel registry (M2); filters drafts by channel                                                |
 * | drafts[]     | drafts: format, title, voice, on-brand score, slop fixes, slot, status                          |
 * | calendar     | Slots from scheduled drafts this week ("Best slot" is a static default until analytics, row     |
 * |              | "Draft-Review")                                                                                 |
 * | starts       | Fixed starting points for the empty state (n-cde 1)                                             |
 *
 * States: success (drafts waiting); empty = Content-Dashboard-Empty (no drafts: three starts, n-cde 2 reminder).
 */
import { Badge } from '../../ui/primitives/Badge';
import { Button, Stack, Text } from '../../ui/primitives';
import { Tabs } from '../../ui/composites/Tabs';
import { ToggleGroup } from '../../ui/composites/ToggleGroup';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { HubColumns } from '../../ui/domain/HubColumns';
import { HubPage } from './parts/HubPage';
import { PageHeader } from './parts/PageHeader';
import { ContentTabPanel } from './parts/ContentTabPanel';
import { CalendarRail } from './parts/CalendarRail';
import { useContentDashboard } from './hooks/useContentDashboard';
import { paths } from './paths';
import type { ContentDashboardData } from './types';

export function ContentDashboard({ data, state = 'success' }: { data: ContentDashboardData; state?: ScreenState }) {
  const view = useContentDashboard(data);
  const empty = state === 'empty' || data.drafts.length === 0;
  const pipeline = (
    <Stack as="span" direction="row" gap={2} align="center" wrap>
      <span>Every draft:</span>
      {data.pipeline.map((p, i) => <Text as="span" key={p} variant="small">{i > 0 && '→ '}<Badge>{p}</Badge></Text>)}
    </Stack>
  );
  const tabs = (
    <Tabs
      label="Drafts by state"
      value={view.tab}
      onChange={view.setTab}
      items={data.tabs.map((t, i) => ({
        id: t.id,
        label: t.label,
        count: t.count,
        panel: <ContentTabPanel tab={t} drafts={view.draftsFor(t.status)} starts={empty && i === 0 ? data.starts : undefined} channelLabel={view.channel === 'all' ? '' : ` for ${view.channel}`} />,
      }))}
    />
  );
  if (empty) {
    return (
      <HubPage section="create" sub="content">
        <PageHeader title="Content" />
        {tabs}
      </HubPage>
    );
  }
  return (
    <HubPage section="create" sub="content">
      <PageHeader title="Content" intro={pipeline} actions={<Button href={paths.draftReview}>+ New draft</Button>} />
      <HubColumns end={<CalendarRail slots={data.calendar} note={data.calendarNote} />}>
        <ToggleGroup label="Filter by channel" options={data.channels} value={[view.channel]} onChange={(v) => view.setChannel(v[0])} />
        {tabs}
      </HubColumns>
    </HubPage>
  );
}
