import type { BrainRule } from '../../domain/brain';
import { proposalGate, proposalNote } from '../../domain/proposal';
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

export interface BrainRulesProps {
  loop: LoopFlow;
  /** The rules to list: the learned ones, or the standing ones (kit gates and your edits); domain/brain.ts brainRules. */
  rules: BrainRule[];
  /** Accessible name of the table. */
  caption: string;
  /** Shown when there are none. */
  empty: string;
}

/**
 * A Brain rules table (canvas Brain). A learned suggestion is approved through its proposal's gate; an active learned
 * rule or one of your edits can be retired; a kit gate is read-only, because it comes from the approved kit and only a
 * new kit version changes it.
 */
export function BrainRules({ loop, rules, caption, empty }: BrainRulesProps) {
  const { links } = useLoopLinks();
  const proposalFor = (r: BrainRule) => loop.proposals.find((p) => p.ruleId === r.id);
  // A learned rule's line is its proposal's (domain/proposal.ts proposalNote); a retired rule says when it was retired.
  const fromCell = (r: BrainRule) => {
    const p = proposalFor(r);
    return p ? `${r.evidence.map((e) => e.label).join(', ')} · ${proposalNote(p, loop.brain.version, r)}` : fromLine(r);
  };
  function action(r: BrainRule) {
    const p = proposalFor(r);
    if (r.status === 'suggested' && p) {
      const gate = proposalGate(p, loop.brain.version);
      return <><Button variant="secondary" href={links.learnRules}>Evidence</Button><Button onClick={() => loop.approveProposal(p)} disabled={gate.blocking} aria-label={`Approve: ${r.text}`}>Approve</Button>{gate.blocking && <Text as="span" variant="small" tone="secondary">{gate.label}</Text>}</>;
    }
    if (r.origin === 'kit') return <Text as="span" variant="small" tone="secondary">From the approved kit</Text>;
    if (r.status === 'active') return <Button variant="secondary" onClick={() => loop.retireRule(r)} aria-label={`Retire: ${r.text}`}>Retire</Button>;
    return <Text as="span" variant="small" tone="secondary">{r.decided ? `Retired ${r.decided.at}` : 'Retired'}</Text>;
  }
  return (
    <DataTable
      caption={caption}
      hideCaption
      rows={rules}
      rowKey={(r) => r.id}
      empty={<Text variant="small" tone="secondary">{empty}</Text>}
      columns={[
        { key: 'text', header: 'Rule', rowHeader: true },
        { key: 'appliesTo', header: 'Applies to' },
        { key: 'from', header: 'From', cell: fromCell },
        { key: 'status', header: 'Status', cell: (r) => <Badge tone={statusBadge[r.status].tone}>{statusBadge[r.status].label}</Badge> },
      ]}
      actions={action}
    />
  );
}
