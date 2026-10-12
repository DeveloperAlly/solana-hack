import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { CopyButton } from './CopyButton';

// Values from canvas boards Onboard-2-Domain (TXT value) and Settings: AI model (endpoint), https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn.
export const example: WorkbenchExample = {
  id: 'C13',
  name: 'CopyButton',
  description: 'Secondary with a visible status line, primary, and label feedback (the button text changes; the status is for screen readers), and both with a reset after 2 s.',
  render: () => (
    <Stack gap={4}>
      <CopyButton value="jamjam-verify=[unique value]" label="Copy value" />
      <CopyButton value="https://jamjam.tech/b/[brand]" label="Copy public link" variant="primary" />
      <CopyButton value="https://api.example.com/v1" label="Copy endpoint" feedback="label" messages={{ copied: 'Copied to the clipboard.' }} />
      <CopyButton value="[Sample post text]" label="Copy text" feedback="both" resetAfter={2000} resultLabels={{ copied: 'Copy text: copied' }} />
    </Stack>
  ),
};
