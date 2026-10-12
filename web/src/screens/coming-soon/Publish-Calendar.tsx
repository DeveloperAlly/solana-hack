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
 * | approvedPosts[]   | GET …/drafts?status=approved; the picker offers only unscheduled ones | no approved posts  |
 *
 * States: success (one failed publish, as drawn), empty (nothing scheduled), loading.
 */
import { useState } from 'react';
import { Alert, Button, Choice, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { SoonPage } from './SoonPage';
import { SoonCopyButton } from '../../ui/domain/SoonCopyButton';
import { SoonWeekCalendar } from '../../ui/domain/SoonWeekCalendar';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { StateView } from './StateView';
import { useSchedule } from './useSchedule';
import { SoonStatusList } from '../../ui/domain/SoonStatusList';
import { SoonStatusRow } from '../../ui/domain/SoonStatusRow';
import { useSoonRoutes } from './routes';
import type { CalendarSlot, PublishCalendarData } from './types';

const slotLabel = (s: CalendarSlot) => (s.status === 'open' ? '[open slot]' : `${s.time} ${s.channel} · ${s.title}`);

export function PublishCalendar({ data, state = 'success' }: { data: PublishCalendarData; state?: ScreenState }) {
  const routes = useSoonRoutes();
  const cal = useSchedule(data);
  const { failed: f, reconnected } = cal;
  // One selection object: the slot picked and the post chosen for it, cleared together (Codex review on PR #79).
  const [selection, setSelection] = useState<{ slot: string; post: string } | null>(null);
  const clearSelection = () => setSelection(null);
  const schedule = () => {
    if (!selection) return;
    cal.schedule(selection.slot, selection.post);
    clearSelection();
  };
  return (
    <SoonPage header={{ title: 'Schedule', intro: 'Approved posts and when they go out.', definedIn: 'component inventory D8 SchedulePicker, D52; delivery plan R4 publishing' }}>
      <StateView
        state={state}
        loading={{ title: 'Loading your schedule', body: 'Reading approved posts and their slots.' }}
        empty={{ title: 'Nothing scheduled yet', body: 'Approve a post, then pick a slot for it here.', actions: <Button href={routes.contentDashboard}>Go to your posts</Button> }}
      >
        {f && (
          <Stack gap={2}>
            <Alert tone="danger" title={`A post didn't go out: "${f.title}" to ${f.channel} failed at ${f.time} (${f.reason}). Nothing was posted twice.`} />
            <Stack direction="row" gap={3} wrap>
              {reconnected ? (
                <Button onClick={cal.retry}>Retry now</Button>
              ) : (
                <Button href={routes.settingsConnections}>Reconnect and retry</Button>
              )}
              <SoonCopyButton text={f.text} label="Copy and post myself" />
            </Stack>
          </Stack>
        )}
        <SoonWeekCalendar label="This week" days={data.days} slots={cal.slots.map((s) => ({ id: s.id, day: s.day, status: s.status, label: slotLabel(s) }))} selectedId={selection?.slot ?? null} onSelect={(slot) => setSelection({ slot, post: '' })} />
        {selection && (
          <Card variant="subtle" as="div">
            <Stack gap={3}>
              {cal.available.length === 0 && <Text tone="secondary">Every approved post is already scheduled. Unschedule one to move it here.</Text>}
              <Choice legend="Schedule an approved post in this slot" options={cal.available.map((p) => ({ value: p.id, label: p.title }))} value={selection.post} onChange={(post) => setSelection({ ...selection, post })} />
              <Stack direction="row" gap={3} wrap>
                <Button onClick={schedule} disabled={!selection.post}>Schedule here</Button>
                <Button variant="secondary" onClick={clearSelection}>Cancel</Button>
              </Stack>
            </Stack>
          </Card>
        )}
        {cal.filled.length > 0 && (
          <SoonStatusList label="Scheduled this session">
            {cal.filled.map((r) => (
              <SoonStatusRow key={r.slotId} name={r.title} detail={r.day} actions={<Button variant="secondary" aria-label={`Unschedule ${r.title}`} onClick={() => cal.unschedule(r.slotId)}>Unschedule</Button>} />
            ))}
          </SoonStatusList>
        )}
        <Text variant="small" tone="secondary">Only approved posts can be scheduled. The published text must hash to the approved text, or it isn't registered.</Text>
      </StateView>
    </SoonPage>
  );
}
