import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { AmbDraftEditor } from './AmbDraftEditor';
import { sampleDraft } from './ambSamples';

function Demo() {
  const [text, setText] = useState(sampleDraft);
  return (
    <Stack gap={5}>
      <AmbDraftEditor label="Draft" value={text} onChange={setText} highlights={["10x your team's output", 'memory dump']} charLimit={3000} />
      <AmbDraftEditor label="Over the limit" value={text} onChange={() => undefined} charLimit={40} />
      <AmbDraftEditor label="Generating" value="" onChange={() => undefined} generating />
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'D5',
  name: 'AmbDraftEditor',
  description: 'Editing with flagged phrases highlighted (canvas Amb-3), over the character limit, and generating (skeleton).',
  render: Demo,
};
