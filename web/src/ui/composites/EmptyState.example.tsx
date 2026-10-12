import type { WorkbenchExample } from '../../system/example';
import { Button, Stack } from '../primitives';
import { EmptyState } from './EmptyState';

export const example: WorkbenchExample = {
  id: 'C3',
  name: 'EmptyState',
  description: 'With icon and actions, and text only.',
  render: () => (
    <Stack gap={3}>
      <EmptyState level={4} icon="plus" title="No drafts yet" body="Start from a brief and JamJam drafts in your voice." actions={<><Button>New draft</Button><Button variant="secondary">Import a post</Button></>} />
      <EmptyState level={4} title="Nothing registered" body="Approved kits and posts appear here." />
    </Stack>
  ),
};
