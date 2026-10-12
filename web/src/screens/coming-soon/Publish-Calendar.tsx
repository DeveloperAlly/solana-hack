/*
 * Data contract: Publish-Calendar (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Publish-Calendar; issue #51)
 * Backend map §4 rows "Publish and Registered (screens missing)": POST /api/drafts/:id/publish (x, linkedin or manual),
 * tables drafts, connections, registrations; "Content-Dashboard": GET …/drafts?status=approved. Inventory D8, D52.
 * Shape: PublishCalendarData in ./types.
 *
 * | Field             | Source                                                       | Empty when                 |
 * |-------------------|--------------------------------------------------------------|----------------------------|
 * | days[]            | The week shown (client)                                      | never                      |
 * | slots[]           | drafts with a scheduled time and channel; open slots (D8)    | nothing scheduled          |
 * | failed            | drafts whose publish failed, with the connection's reason    | nothing failed             |
 * | approvedPosts[]   | GET …/drafts?status=approved (unscheduled)                   | no approved posts          |
 *
 * States: success (one failed publish, as drawn), empty (nothing scheduled), loading.
 */
import { useState } from 'react';
import { Alert, Button, Choice, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { SoonHubFrame } from '../../ui/domain/SoonHubFrame';
import { SoonCopyButton } from '../../ui/domain/SoonCopyButton';
import { SoonWeekCalendar } from '../../ui/domain/SoonWeekCalendar';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { StateView } from './StateView';
import { soonRoutes } from './routes';
import type { CalendarSlot, PublishCalendarData } from './types';

const slotLabel = (s: CalendarSlot) => (s.status === 'open' ? '[open slot]' : `${s.time} ${s.channel} · ${s.title}`);

export function PublishCalendar({ data, state = 'success' }: { data: PublishCalendarData; state?: ScreenState }) {
  const [slots, setSlots] = useState<CalendarSlot[]>(data.slots);
  const [picked, setPicked] = useState<string | null>(null);
  const [post, setPost] = useState('');
  const f = data.failed;
  // INTEGRATION: PATCH /api/drafts/:id { scheduled_at } (D8); only approved posts can be scheduled.
  const schedule = () => {
    const title = data.approvedPosts.find((p) => p.id === post)?.title;
    setSlots((ss) => ss.map((s) => (s.id === picked ? { ...s, status: 'scheduled', time: '[time]', channel: 'LinkedIn', title } : s)));
    setPicked(null);
    setPost('');
  };
  return (
    <SoonHubFrame header={{ title: 'Schedule', intro: 'Approved posts and when they go out.', definedIn: 'component inventory D8 SchedulePicker, D52; delivery plan R4 publishing' }}>
      <StateView
        state={state}
        loading={{ title: 'Loading your schedule', body: 'Reading approved posts and their slots.' }}
        empty={{ title: 'Nothing scheduled yet', body: 'Approve a post, then pick a slot for it here.', actions: <Button href={soonRoutes.contentDashboard}>Go to your posts</Button> }}
      >
        {f && (
          <Stack gap={2}>
            <Alert tone="danger" title={`A post didn't go out: "${f.title}" to ${f.channel} failed at ${f.time} (${f.reason}). Nothing was posted twice.`} />
            <Stack direction="row" gap={3} wrap>
              <Button href={soonRoutes.settingsConnections}>Reconnect and retry</Button>
              <SoonCopyButton text={f.text} label="Copy and post myself" />
            </Stack>
          </Stack>
        )}
        <SoonWeekCalendar label="This week" days={data.days} slots={slots.map((s) => ({ id: s.id, day: s.day, status: s.status, label: slotLabel(s) }))} selectedId={picked} onSelect={setPicked} />
        {picked && (
          <Card variant="subtle" as="div">
            <Stack gap={3}>
              <Choice legend="Schedule an approved post in this slot" options={data.approvedPosts.map((p) => ({ value: p.id, label: p.title }))} value={post} onChange={setPost} />
              <Stack direction="row" gap={3} wrap>
                <Button onClick={schedule} disabled={!post}>Schedule here</Button>
                <Button variant="secondary" onClick={() => setPicked(null)}>Cancel</Button>
              </Stack>
            </Stack>
          </Card>
        )}
        <Text variant="small" tone="secondary">Only approved posts can be scheduled. The published text must hash to the approved text, or it isn't registered.</Text>
      </StateView>
    </SoonHubFrame>
  );
}
