import { List } from '../../../ui/composites/ListRow';
import { EventInviteRow } from '../../../ui/domain/EventInviteRow';
import { Heading, Stack } from '../../../ui/primitives';
import { eventRoles, isEventRole } from '../../../domain/event';
import { eventDay } from '../eventPlan';
import type { EventsFlow } from '../useEvents';

const roles = eventRoles.map((r) => ({ value: r.id, label: r.label }));

/** New events from the Luma calendar, each to accept (with a role) or skip. Renders nothing when none wait. */
export function EventsPending({ flow }: { flow: EventsFlow }) {
  if (flow.pending.length === 0) return null;
  return (
    <Stack gap={3}>
      <Heading level={2} size="lg">New from your Luma calendar</Heading>
      <List label="New from your Luma calendar">
        {flow.pending.map((e) => (
          <EventInviteRow key={e.id} name={e.name} detail={`${eventDay(e.startsAt)} · ${e.place}`} roles={roles} onAccept={(r) => isEventRole(r) && flow.accept(e.id, r)} onSkip={() => flow.skip(e.id)} />
        ))}
      </List>
    </Stack>
  );
}
