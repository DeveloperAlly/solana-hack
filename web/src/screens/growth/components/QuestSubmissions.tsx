import { List } from '../../../ui/composites/ListRow';
import { EmptyState } from '../../../ui/composites/EmptyState';
import { QueueItem } from '../../../ui/domain/QueueItem';
import { Heading, Stack } from '../../../ui/primitives';
import { useGrowthLinks } from '../paths';
import type { QuestsFlow } from '../useQuests';

/** Submissions as items of the one approval queue (the same QueueItem and gate Today uses). */
export function QuestSubmissions({ flow }: { flow: QuestsFlow }) {
  const links = useGrowthLinks();
  return (
    <Stack gap={3}>
      <Heading level={2} size="lg">Submissions</Heading>
      {flow.submissions.length === 0 ? (
        <EmptyState title="No submissions here" body="When someone completes a quest, their work waits here and in Today for your approval." level={3} />
      ) : (
        <List label="Quest submissions">
          {flow.submissions.map((s) => (
            <QueueItem key={s.item.id} item={s.item} gate={s.gate} openHref={links.to(s.item.open.artboard)} onAct={() => flow.approve(s.item.id)} outcome={s.outcome} />
          ))}
        </List>
      )}
    </Stack>
  );
}
