import { ToggleGroup } from '../../../ui/composites/ToggleGroup';
import { Select, Stack } from '../../../ui/primitives';
import { eventRoles } from '../../../domain/event';
import type { EventsFlow } from '../useEvents';
import type { EventsTab } from '../types';

/** Upcoming or Past, and the role filter (canvas v21 Events). */
export function EventsControls({ flow }: { flow: EventsFlow }) {
  const views = [
    { id: 'upcoming', label: `Upcoming · ${flow.upcoming.length}` },
    { id: 'past', label: `Past · ${flow.past.length}` },
  ];
  return (
    <Stack direction="row" gap={4} wrap align="end" justify="between">
      <ToggleGroup label="Event views" options={views} value={[flow.tab]} onChange={([t]) => flow.setTab(t as EventsTab)} />
      <Select label="Role" layout="inline" options={[{ value: 'all', label: 'All roles' }, ...eventRoles.map((r) => ({ value: r.id, label: r.label }))]} value={flow.role} onValueChange={flow.setRoleFilter} />
    </Stack>
  );
}
