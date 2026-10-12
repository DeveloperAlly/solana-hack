import type { WorkbenchExample } from '../../system/example';
import { Link, Stack } from '../primitives';
import { StatusTimeline } from './StatusTimeline';

// Steps from canvas boards Amb-5a/b/c/d and M-5-Status (note n-m5; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'C9',
  name: 'StatusTimeline',
  description: 'Horizontal payout status with a current step and an action; vertical with a failed step.',
  render: () => (
    <Stack gap={5}>
      <StatusTimeline
        label="Post status"
        steps={[
          { label: 'Published', state: 'done', note: '16:21', action: <Link href="/system">View post</Link> },
          { label: 'Verifying', state: 'current', note: 'Usually under a minute' },
          { label: 'Approved', state: 'todo' },
          { label: 'Paid', state: 'todo' },
        ]}
      />
      <StatusTimeline
        label="Post status, mobile"
        orientation="vertical"
        steps={[
          { label: 'Published', state: 'done', note: '16:21' },
          { label: 'Verifying', state: 'failed', note: 'We could not find the post at that URL.' },
          { label: 'Approved', state: 'todo' },
        ]}
      />
    </Stack>
  ),
};
