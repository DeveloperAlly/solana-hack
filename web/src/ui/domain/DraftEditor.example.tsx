import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { DraftEditor } from './DraftEditor';
import { sampleDraft } from './ambSamples';

function Demo() {
  const [text, setText] = useState(sampleDraft);
  return (
    <Stack gap={5}>
      <DraftEditor label="Draft" value={text} onChange={setText} highlights={["10x your team's output", 'memory dump']} charLimit={3000} />
      <DraftEditor label="Over the limit" value={text} onChange={() => undefined} charLimit={40} />
      <DraftEditor label="Generating" value="" onChange={() => undefined} generating />
      <DraftEditor label="Registered (read only)" value={text} onChange={() => undefined} readOnly hint="Registered on Solana: a registered post cannot change." />
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'D5',
  name: 'DraftEditor',
  description: 'Editing with flagged phrases highlighted (canvas Amb-3, Draft-Review), over the character limit, generating (skeleton), and read only.',
  render: Demo,
};
