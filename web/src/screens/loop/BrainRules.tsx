import type { BrainRule } from '../../domain/brain';
import { proposalGate } from '../../domain/proposal';
import { Badge, Button, Text } from '../../ui/primitives';
import { DataTable } from '../../ui/composites/DataTable';
import type { LoopFlow } from '../../flows/loop/useLoop';
import { useLoopLinks } from './paths';

const statusBadge: Record<BrainRule['status'], { label: string; tone: 'neutral' | 'solid' }> = {
  suggested: { label: 'Suggested', tone: 'neutral' },
  active: { label: 'Active', tone: 'solid' },
  retired: { label: 'Retired', tone: 'neutral' },
};

const decidedVerb: Record<BrainRule['status'], string> = { suggested: 'suggested', active: 'approved', retired: 'retired' };
const fromLine = (r: BrainRule) => [r.evidence.map((e) => e.label).join(', '), r.decided && `${decidedVerb[r.status]} ${r.decided.at}`].filter(Boolean).join(' · ');

/** The Brain's learned-rules table (canvas Brain): approve a suggestion through its proposal's gate, retire a rule. */
export function BrainRules({ loop }: { loop: LoopFlow }) {
  const { links } = useLoopLinks();
  const proposalFor = (r: BrainRule) => loop.proposals.find((p) => p.ruleId === r.id);
  function action(r: BrainRule) {
    const p = proposalFor(r);
    if (r.status === 'suggested' && p) {
      const gate = proposalGate(p, loop.brain.version);
      return <><Button variant="secondary" href={links.learnRules}>Evidence</Button><Button onClick={() => loop.approveProposal(p)} disabled={gate.blocking} aria-label={`Approve: ${r.text}`}>Approve</Button>{gate.blocking && <Text as="span" variant="small" tone="secondary">{gate.label}</Text>}</>;
    }
    if (r.status === 'active') return <Button variant="secondary" onClick={() => loop.retireRule(r)} aria-label={`Retire: ${r.text}`}>Retire</Button>;
    return <Text as="span" variant="small" tone="secondary">{r.decided ? `Retired ${r.decided.at}` : 'Retired'}</Text>;
  }
  return (
    <DataTable
      caption="Every rule, its evidence and status"
      hideCaption
      rows={loop.brain.rules}
      rowKey={(r) => r.id}
      empty={<Text variant="small" tone="secondary">Rules appear after 14 days of results. Until then, drafts follow the kit and your voices.</Text>}
      columns={[
        { key: 'text', header: 'Rule', rowHeader: true },
        { key: 'appliesTo', header: 'Applies to' },
        { key: 'from', header: 'From', cell: fromLine },
        { key: 'status', header: 'Status', cell: (r) => <Badge tone={statusBadge[r.status].tone}>{statusBadge[r.status].label}</Badge> },
      ]}
      actions={action}
    />
  );
}
