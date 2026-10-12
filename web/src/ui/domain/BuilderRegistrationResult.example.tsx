import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { BuilderRegistrationResult } from './BuilderRegistrationResult';

// Fields from canvas boards Onboard-6-Published and Kit-RegisterFailed (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50).
export const example: WorkbenchExample = {
  id: 'D50',
  name: 'BuilderRegistrationResult',
  description: 'Registered record, and a failed registration with Retry and Copy error details.',
  render: () => (
    <Stack gap={6}>
      <BuilderRegistrationResult status="registered" items={[{ label: 'Version', value: 'v1' }, { label: 'Kit hash', value: '[sha256 of kit v1]' }]} note="Only the hash, version and approver are written onchain." />
      <BuilderRegistrationResult
        status="failed"
        items={[{ label: 'Version', value: 'v1' }, { label: 'Registered on Solana', value: 'Not yet · last try [time]' }]}
        reason="[Plain-language reason, e.g. &quot;the network didn't confirm in time&quot;]."
        errorDetails="[error details]"
        retryHref="/system"
      />
    </Stack>
  ),
};
