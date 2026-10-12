/*
 * Data contract: Engage-Queue (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Engage-Queue,
 * note n-eq). Shape: EngageQueueData in ./types.ts. Backend map §4 Grow, row "Engage-Queue": `GET …/replies`,
 * `POST /api/replies/:id/send` (table drafts; X mention reads and reply posts, cron; no LinkedIn comments).
 *
 * | Field           | Source                                                                                         |
 * |-----------------|------------------------------------------------------------------------------------------------|
 * | queue[]         | Mentions, comments and community questions with drafted replies (drafts, kind reply)           |
 * | queue[].draft   | Drafted reply in the Replies voice after the slop check; absent = held, low confidence (n-eq 2) |
 * | suggestions     | "Worth engaging": public conversations matching the content pillars; you choose (n-eq 3)       |
 * | listsCount      | Suggested lists (Engage-Rules)                                                                 |
 * | never           | Product promise: no follow, unfollow or like automation (n-eq 4)                               |
 *
 * Empty: no mentions yet ("Nothing to reply to"). States drawn: success only.
 */
import { useState } from 'react';
import { Button, Heading, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { EmptyState } from '../../ui/composites/EmptyState';
import { Tabs } from '../../ui/composites/Tabs';
import { HubColumns } from '../../ui/domain/HubColumns';
import { HubPage } from './parts/HubPage';
import { PageHeader } from './parts/PageHeader';
import { ReplyCard, type ReplyOutcome } from './parts/ReplyCard';
import { WorthEngaging } from './parts/WorthEngaging';
import { useReviewQueue } from './hooks/useReviewQueue';
import { useHubLinks } from './paths';
import { useOutcomes } from './hooks/useOutcomes';
import { useHubSession } from './hooks/useHubSession';
import type { EngageQueueData } from './types';

export function EngageQueue({ data }: { data: EngageQueueData }) {
  const links = useHubLinks();
  const queue = useReviewQueue<ReplyOutcome>();
  const [tab, setTab] = useState('queue');
  const drafted = useOutcomes<'drafted'>();
  const worth = { suggestions: data.suggestions, note: data.suggestionsNote, isDrafted: (id: string) => !!drafted.outcomeOf(id), onDraft: (id: string) => drafted.set(id, 'drafted') };
  const [session] = useHubSession();
  // Items routed by a rule that was switched off on Engage-Rules leave the queue.
  const routed = data.queue.filter((q) => !session.rulesOff.includes(q.rule));
  const hidden = data.queue.length - routed.length;
  const sent = routed.filter((q) => queue.outcomeOf(q.id) === 'sent');
  const waiting = routed.filter((q) => queue.outcomeOf(q.id) !== 'sent');
  const list = (items: typeof data.queue, empty: string) =>
    items.length ? <Stack gap={4}>{items.map((q) => <ReplyCard key={q.id} item={q} queue={queue} />)}</Stack> : <EmptyState level={3} title={empty} />;
  return (
    <HubPage section="grow" sub="engagement">
      <PageHeader title="Engagement" tag="STRETCH" intro={data.intro} actions={<Button variant="secondary" href={links.engageRules}>Rules, lists and auto-replies</Button>} />
      <HubColumns
        end={
          <Stack as="aside" gap={4} aria-label="Suggestions and limits">
            <WorthEngaging {...worth} />
            <Card variant="subtle" labelledBy="eq-never" header={<Heading level={2} size="lg" id="eq-never">What we never do</Heading>}>
              <Text variant="small">{data.never}</Text>
            </Card>
          </Stack>
        }
      >
        <Tabs
          label="Engagement"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'queue', label: 'Reply queue', count: waiting.length, panel: <>{hidden > 0 && <Text variant="small" tone="secondary">{hidden} hidden by rules that are off.</Text>}{list(waiting, 'Nothing to reply to')}</> },
            { id: 'worth', label: 'Worth engaging', count: data.suggestions.length, panel: <WorthEngaging {...worth} level={3} /> },
            { id: 'lists', label: 'Suggested lists', count: data.listsCount, panel: <Button variant="secondary" href={links.engageRules}>Review suggested lists</Button> },
            { id: 'sent', label: 'Sent', count: sent.length, panel: list(sent, 'Nothing sent yet') },
          ]}
        />
      </HubColumns>
    </HubPage>
  );
}
