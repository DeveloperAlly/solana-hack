import type { WorkbenchExample } from '../../system/example';
import { today } from '../../screens/loop/fixtures';
import { gateFor } from '../../domain/queue';
import { adnaProposals } from '../../domain/fixtures/proposals';
import { DecisionQueue } from './DecisionQueue';
import { QueueItem } from './QueueItem';

// Items from canvas v24 board Today (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
const ctx = { brainVersion: '3.1', proposal: (id: string) => adnaProposals.find((p) => p.id === id), quest: () => undefined };
const pick = (id: string) => today.queue.find((i) => i.id === id)!;

export const example: WorkbenchExample = {
  id: 'D73',
  name: 'QueueItem',
  description: 'A draft that passes, a draft blocked by the claims gate (Approve disabled), a sent reply, a stale approval, and a link-only event item.',
  render: () => (
    <DecisionQueue title="Queue item examples" count={5}>
      <QueueItem item={pick('q-draft-x')} gate={gateFor(pick('q-draft-x'), ctx)} openHref="/system" whyHref="/system" onAct={() => undefined} />
      <QueueItem item={pick('q-blog')} gate={gateFor(pick('q-blog'), ctx)} openHref="/system" onAct={() => undefined} />
      <QueueItem item={pick('q-reply')} gate={gateFor(pick('q-reply'), ctx)} openHref="/system" onAct={() => undefined} outcome="Sent." />
      <QueueItem item={{ ...pick('q-draft-x'), id: 'stale' }} gate={gateFor(pick('q-draft-x'), ctx)} openHref="/system" onAct={() => undefined} status="Your approval went stale: the Brain changed since. Approve it again." />
      <QueueItem item={pick('q-event')} gate={gateFor(pick('q-event'), ctx)} openHref="/system" />
    </DecisionQueue>
  ),
};
