import { proposalNote, type Proposal } from '../../domain/proposal';
import type { BrainRule } from '../../domain/brain';
import { Button, Heading } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { List, ListRow } from '../../ui/composites/ListRow';
import { useLoopLinks } from './paths';

/** Learn-Rules' "Decided" list: approved rules link to the Brain; rejected ones say so. */
export function DecidedProposals({ proposals, brainVersion, rules }: { proposals: Proposal[]; brainVersion: string; rules: BrainRule[] }) {
  const { links } = useLoopLinks();
  if (proposals.length === 0) return null;
  return (
    <Card labelledBy="decided-h" header={<Heading level={2} size="lg" id="decided-h">Decided</Heading>}>
      <List label="Decided">
        {proposals.map((p) => (
          <ListRow
            key={p.id}
            title={[p.title, proposalNote(p, brainVersion, rules.find((r) => r.id === p.ruleId)), p.decided?.at].filter(Boolean).join(' · ')}
            status={p.status === 'rejected' ? { label: 'Rejected' } : undefined}
            actions={p.status === 'approved' ? <Button variant="secondary" href={links.brain}>In the Brain</Button> : undefined}
          />
        ))}
      </List>
    </Card>
  );
}
