import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { JourneyInlineForm } from './JourneyInlineForm';

const required = (v: string) => (v ? null : 'Enter something first.');
const noop = () => undefined;

export const example: WorkbenchExample = {
  id: 'D84',
  name: 'JourneyInlineForm',
  description: 'Default (submit empty to see the error), multiline with Cancel, busy, and an error from outside.',
  render: () => (
    <Stack gap={4}>
      <JourneyInlineForm label="Your website" submitLabel="Read my site" defaultValue="jamjam.tech" validate={required} onSubmit={noop} />
      <JourneyInlineForm label="Paste the text" submitLabel="Add" multiline validate={required} onSubmit={noop} onCancel={noop} />
      <JourneyInlineForm label="Email" type="email" submitLabel="Email me a sign-in link" busy busyLabel="Sending…" defaultValue="you@yourbrand.com" validate={required} onSubmit={noop} />
      <JourneyInlineForm label="Code from the email" submitLabel="Continue" error="That code didn't match. Check the latest email." validate={required} onSubmit={noop} />
    </Stack>
  ),
};
