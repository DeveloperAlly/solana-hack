import type { WorkbenchExample } from '../../system/example';
import { eventRoles } from '../../domain/event';
import { EventAddForm } from './EventAddForm';

export const example: WorkbenchExample = {
  id: 'D94',
  name: 'EventAddForm',
  description: 'Add an event by hand; submit empty to see every error.',
  render: () => <EventAddForm roles={eventRoles.map((r) => ({ value: r.id, label: r.label }))} onSubmit={() => undefined} onCancel={() => undefined} />,
};
