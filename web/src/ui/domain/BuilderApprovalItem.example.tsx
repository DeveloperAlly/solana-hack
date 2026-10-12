import type { WorkbenchExample } from '../../system/example';
import { BuilderApprovalItem } from './BuilderApprovalItem';

// Submission from canvas board Dashboard (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50). Sample data.
export const example: WorkbenchExample = {
  id: 'D1',
  name: 'BuilderApprovalItem',
  description: 'Ambassador post awaiting approval: Approve, then Pay (owner only); Reject asks for a reason.',
  render: () => (
    <ul className="wl-list">
      <BuilderApprovalItem
        item={{ id: 's1', kind: 'LinkedIn post', author: 'Mai T.', amount: '10 USDC', excerpt: 'My coding agent lost a full day of work last week. Not the code. The context…', checks: ['On-brand 91%', 'Verified on LinkedIn'], link: { label: 'Open post', href: '/system' } }}
      />
    </ul>
  ),
};
