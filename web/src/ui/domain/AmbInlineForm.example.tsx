import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack, Text } from '../primitives';
import { AmbInlineForm } from './AmbInlineForm';

// The screens pass the real validators (screens/ambassador/validators.ts); the example only needs a required check.
const requireEmail = (v: string) => (v ? null : 'Enter your email to join.');

function Demo() {
  const [sent, setSent] = useState<string | null>(null);
  return (
    <Stack gap={3}>
      <AmbInlineForm label="Sign in with email to join" type="email" placeholder="mai@[email]" submitLabel="Join and start writing" validate={requireEmail} onSubmit={setSent} />
      {sent && <Text role="status">Submitted {sent}</Text>}
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'P17',
  name: 'AmbInlineForm',
  description: 'One field and a submit button; submit with a bad value to see the error (canvas Amb-2 inline sign-in, Amb-4 URL routes).',
  render: Demo,
};
