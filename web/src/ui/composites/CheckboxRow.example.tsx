import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { CheckboxRow } from './CheckboxRow';

function Demo() {
  const [on, setOn] = useState(true);
  return (
    <Stack gap={1}>
      <CheckboxRow label="Only claims with evidence" description="Drafts may state a fact only if the kit backs it." checked={on} onChange={(e) => setOn(e.target.checked)} />
      <CheckboxRow label="All channels" description="Some channels are selected." indeterminate readOnly checked={false} />
      <CheckboxRow label="Unchecked" readOnly checked={false} />
      <CheckboxRow label="AI disclosure" description="Locked on by policy." disabled checked readOnly />
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'P14',
  name: 'CheckboxRow',
  description: 'Checked, indeterminate, unchecked and disabled rows (P14 Checkbox with label and description).',
  render: () => <Demo />,
};
