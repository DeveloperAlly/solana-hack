import type { WorkbenchExample } from '../../system/example';
import { eventRoles } from '../../domain/event';
import { List } from '../composites/ListRow';
import { EventInviteRow } from './EventInviteRow';

// Event names stay bracketed (never a real event).
const roles = eventRoles.map((r) => ({ value: r.id, label: r.label }));

export const example: WorkbenchExample = {
  id: 'D95',
  name: 'EventInviteRow',
  description: 'A new Luma event to accept (asks for the role) or skip.',
  render: () => (
    <List label="New from Luma">
      <EventInviteRow name="[Hackathon] demo day" detail="Sat 25 Oct · Online" roles={roles} onAccept={() => undefined} onSkip={() => undefined} />
      <EventInviteRow name="[Summit] side event" detail="Wed 12 Nov · Lisbon" roles={roles} onAccept={() => undefined} onSkip={() => undefined} />
    </List>
  ),
};
