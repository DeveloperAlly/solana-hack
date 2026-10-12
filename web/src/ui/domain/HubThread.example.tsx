import type { WorkbenchExample } from '../../system/example';
import { HubThread } from './HubThread';

export const example: WorkbenchExample = {
  id: 'D39',
  name: 'HubThread',
  description: 'A two-message thread: one sent by the brand, one received.',
  render: () => (
    <HubThread
      label="Thread with [Name]"
      messages={[
        { id: '1', from: 'me', text: "Love the integration. Let's do a joint post once it's live." },
        { id: '2', from: 'them', text: "It's live! Still up for the co-marketing post next week?" },
      ]}
    />
  ),
};
