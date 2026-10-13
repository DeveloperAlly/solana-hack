import type { WorkbenchExample } from '../../system/example';
import { eventSourceStatus, findEventSource } from '../../config/eventSources';
import { Button } from '../primitives';
import { EventSourceCard } from './EventSourceCard';

const luma = findEventSource('luma');

export const example: WorkbenchExample = {
  id: 'D96',
  name: 'EventSourceCard',
  description: 'The Luma source from the registry: facts with sources, the unverified line, a connect action.',
  render: () => (
    <EventSourceCard
      title="From your Luma calendar"
      status={eventSourceStatus('luma')}
      summary="2 events synced from lu.ma/[your-calendar] · new events arrive here to accept or skip."
      facts={luma.facts}
      requirement={luma.requirement}
      unverified={luma.unverified}
      actions={<Button variant="secondary" href="/system">Connect Luma</Button>}
    />
  ),
};
