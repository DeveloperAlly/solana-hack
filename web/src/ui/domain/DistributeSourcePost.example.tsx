import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Link, Stack } from '../primitives';
import { DistributeSourcePost } from './DistributeSourcePost';

// Copy from canvas v21 Distribute-Adapt (the approved aDNA post).
function Live() {
  const [text, setText] = useState('Your agent didn’t forget. It was never told…');
  const [edited, setEdited] = useState(false);
  return (
    <DistributeSourcePost
      label="Approved · X"
      text={text}
      onSave={(t) => { setText(t); setEdited(true); }}
      staleNote={edited ? 'The original changed, so 2 approved versions need approving again.' : undefined}
      link={<Link href="/system">Post detail</Link>}
    />
  );
}

export const example: WorkbenchExample = {
  id: 'D93',
  name: 'DistributeSourcePost',
  description: 'The approved original: reading, editing (interactive), and with stale versions.',
  render: () => <Stack gap={4}><Live /><DistributeSourcePost label="Approved · LinkedIn" text="One folder of context." onSave={() => undefined} staleNote="The original changed, so 1 approved version needs approving again." /></Stack>,
};
