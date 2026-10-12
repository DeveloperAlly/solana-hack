import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { completeScores, emptyRatingDraft } from '../../domain/rating';
import { EventRatingFields } from './EventRatingFields';

function Live() {
  const [scores, setScores] = useState(emptyRatingDraft());
  const [line, setLine] = useState('');
  const missing = Object.values(scores).filter((s) => s === null).length;
  const gate = completeScores(scores) ? { blocking: false, label: 'Ready to register.' } : { blocking: true, label: `Choose ${missing} more ${missing === 1 ? 'rating' : 'ratings'}.` };
  return <EventRatingFields locked={false} scores={scores} onScore={(q, s) => setScores({ ...scores, [q]: s })} line={line} onLine={setLine} gate={gate} onRegister={() => undefined} registerLabel="Register my rating" />;
}

export const example: WorkbenchExample = {
  id: 'D103',
  name: 'EventRatingFields',
  description: 'Five ratings and a line: locked before proof; unlocked (interactive), Register waits for all five.',
  render: () => (
    <Stack gap={6}>
      <EventRatingFields locked scores={emptyRatingDraft()} onScore={() => undefined} line="" onLine={() => undefined} gate={{ blocking: true, label: 'Prove you went first.' }} onRegister={() => undefined} registerLabel="Register my rating" />
      <Live />
    </Stack>
  ),
};
