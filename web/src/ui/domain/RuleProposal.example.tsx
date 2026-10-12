import type { WorkbenchExample } from '../../system/example';
import { adnaProposals } from '../../domain/fixtures/proposals';
import { proposalGate } from '../../domain/proposal';
import { Stack } from '../primitives';
import { RuleProposal } from './RuleProposal';

// Proposals from canvas v24 board Learn-Rules (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
const noop = () => undefined;
const [x, recaps] = adnaProposals;

export const example: WorkbenchExample = {
  id: 'D74',
  name: 'RuleProposal',
  description: 'A pending proposal (emphasis), one on trial, and one judged against an older Brain (Approve blocked, Check it again).',
  render: () => (
    <Stack gap={4}>
      <RuleProposal proposal={x} gate={proposalGate(x, '3.1')} brainVersion="3.1" nextVersion="3.2" citesHref="/system" onApprove={noop} onReject={noop} onTrial={noop} onRecheck={noop} emphasis />
      <RuleProposal proposal={{ ...x, id: 'trial', status: 'trial', title: `${x.title} (trial)` }} gate={proposalGate({ ...x, status: 'trial' }, '3.1')} brainVersion="3.1" nextVersion="3.2" citesHref="/system" onApprove={noop} onReject={noop} onTrial={noop} onRecheck={noop} />
      <RuleProposal proposal={recaps} gate={proposalGate(recaps, '3.2')} brainVersion="3.2" nextVersion="3.3" citesHref="/system" onApprove={noop} onReject={noop} onTrial={noop} onRecheck={noop} />
    </Stack>
  ),
};
