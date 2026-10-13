import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { EventPlanPhase } from './EventPlanPhase';

// Copy from canvas v21 Event-Detail (speaking plan).
export const example: WorkbenchExample = {
  id: 'D97',
  name: 'EventPlanPhase',
  description: 'Plan phases: published, needs you, drafted plus an ambassador item, after the event.',
  render: () => (
    <Stack gap={4}>
      <EventPlanPhase title="Announce" timing="14 days before" items={[{ id: 'a', status: { label: 'Published', tone: 'solid' }, brief: 'X + LinkedIn: "I’m speaking at agent tooling night…"', action: { label: 'Post', href: '/system' } }]} />
      <EventPlanPhase title="Countdown" timing="3 days before" items={[{ id: 'c', status: { label: 'Needs you', tone: 'warning' }, brief: '3 posts: talk teaser, what you’ll learn, find me there', action: { label: 'Review', href: '/system' } }]} />
      <EventPlanPhase title="Live" timing="On the day" items={[
        { id: 'l', status: { label: 'Drafted' }, brief: 'Slide-by-slide thread, ready to post as you speak', action: { label: 'Review', href: '/system' } },
        { id: 'k', status: { label: 'Ambassadors' }, brief: '3 ambassadors attending get a live kit', action: { label: 'Brief', href: '/system' } },
      ]} />
      <EventPlanPhase title="Announce (not drafted)" timing="21 days before" items={[{ id: 'n', status: { label: 'Not drafted' }, brief: 'Invite post with the event page link', action: { label: 'Draft the post', onClick: () => undefined } }]} />
      <EventPlanPhase title="Recap" timing="Within 24 h" items={[{ id: 'r', status: { label: 'After the event' }, brief: 'Recap post from your notes and photos; claims checked' }]} />
    </Stack>
  ),
};
