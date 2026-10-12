import type { Proposal } from '../../domain/proposal';
import { Button, Heading } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { List, ListRow } from '../../ui/composites/ListRow';
import { useLoopLinks } from './paths';

/** Learn-Rules' "Decided" list: approved rules link to the Brain; rejected ones say so. */
export function DecidedProposals({ proposals }: { proposals: Proposal[] }) {
  const { links } = useLoopLinks();
  if (proposals.length === 0) return null;
  return (
    <Card labelledBy="decided-h" header={<Heading level={2} size="lg" id="decided-h">Decided</Heading>}>
      <List label="Decided">
        {proposals.map((p) => (
          <ListRow
            key={p.id}
            title={`${p.title} · ${p.status} ${p.decided?.at ?? ''}`.trim()}
            status={p.status === 'rejected' ? { label: 'Rejected' } : undefined}
            actions={p.status === 'approved' ? <Button variant="secondary" href={links.brain}>In the Brain</Button> : undefined}
          />
        ))}
      </List>
    </Card>
  );
}
