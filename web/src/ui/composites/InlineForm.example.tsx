import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { InlineForm } from './InlineForm';

// Copy from canvas boards Onboard-3-Sources, Amb-2-Detail (note n-a2), Settings: AI model and Brands
// (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
const email = (v: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter an email address like you@example.com.');
const url = (v: string) => (/^(https?:\/\/)?[^\s.]+\.[^\s]+$/.test(v) ? null : 'Enter a web address like jamjam.tech or https://example.com/page.');
const required = (name: string) => (v: string) => (v ? null : `Enter ${name}.`);

export const example: WorkbenchExample = {
  id: 'C30',
  name: 'InlineForm',
  description: 'One field (inline email join), row layout that resets (add a link), multi-field card with Cancel, and collapsed behind a trigger.',
  render: () => (
    <Stack gap={6}>
      <InlineForm label="Join with your email" fields={[{ name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', validate: email }]} submitLabel="Join campaign" onSubmit={() => undefined} />
      <InlineForm label="Add a link" layout="row" resetOnSubmit fields={[{ name: 'url', label: 'Add a link', placeholder: 'Paste a URL', inputMode: 'url', validate: url }]} submitLabel="Add link" submitVariant="secondary" onSubmit={() => undefined} />
      <InlineForm
        label="Add endpoint"
        surface="card"
        fields={[
          { name: 'name', label: 'Name', validate: required('a name') },
          { name: 'endpoint', label: 'Endpoint URL', type: 'url', hint: 'An OpenAI-compatible base URL.', validate: url },
        ]}
        submitLabel="Add endpoint"
        onSubmit={() => undefined}
        onCancel={() => undefined}
      />
      <InlineForm triggerLabel="Add a brand" label="Add a brand" surface="card" fields={[{ name: 'brand', label: 'Brand name', validate: required('a brand name') }]} submitLabel="Add brand" onSubmit={() => undefined} />
    </Stack>
  ),
};
