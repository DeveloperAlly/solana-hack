import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack, Text } from '../primitives';
import { BuilderSignInForm } from './BuilderSignInForm';

function Demo() {
  const [done, setDone] = useState<string | null>(null);
  return (
    <Stack gap={3}>
      <BuilderSignInForm resendNote="Didn't get it? Resend in 0:24" onVerified={setDone} />
      <Text variant="small" tone="secondary">{done ? `Signed in as ${done}` : 'Not signed in'}</Text>
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'D-signin',
  name: 'BuilderSignInForm',
  description: 'Email then a 6–10 digit code, both checked on the client (canvas Onboard-1-SignIn).',
  render: () => <Demo />,
};
