import type { WorkbenchExample } from '../../system/example';
import { adnaPosts } from '../../domain/fixtures/posts';
import { Stack } from '../primitives';
import { PostLifecycle } from './PostLifecycle';

// Posts from canvas v24 board Post-Detail and its note's variants (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'D70',
  name: 'PostLifecycle',
  description: 'Amplified (the board), draft only, approval stale after an edit, publish failed on one platform, and results ready (compact).',
  render: () => (
    <Stack gap={5}>
      {['post-launch', 'post-blog', 'post-stale', 'post-failed'].map((id) => <PostLifecycle key={id} post={adnaPosts.find((p) => p.id === id)!} brainVersion="3.1" label={`Lifecycle: ${id}`} />)}
      <PostLifecycle post={adnaPosts.find((p) => p.id === 'post-results')!} brainVersion="3.1" variant="compact" label="Lifecycle: post-results" />
    </Stack>
  ),
};
