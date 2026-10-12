import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { proofTransition, type AttendanceProof } from '../../domain/rating';
import { EventProofStep } from './EventProofStep';

// Interactive: Luma proves; any email except attendee@example.com fails (sample guest list).
function Live() {
  const [proof, setProof] = useState<AttendanceProof>({ status: 'not-proven' });
  const go = (kind: 'luma-checkin' | 'guest-list-email', ok: boolean) => {
    const proving = proofTransition(proof, { type: 'start', kind });
    setProof(proofTransition(proving, ok ? { type: 'succeed' } : { type: 'fail', reason: 'That email is not on the guest list.' }));
  };
  return <EventProofStep proof={proof} onLuma={() => go('luma-checkin', true)} onEmail={(e) => go('guest-list-email', e === 'attendee@example.com')} onReset={() => setProof(proofTransition(proof, { type: 'reset' }))} />;
}

export const example: WorkbenchExample = {
  id: 'D102',
  name: 'EventProofStep',
  description: 'Prove you went: not proven (interactive), proving, proven, failed.',
  render: () => (
    <Stack gap={6}>
      <Live />
      <EventProofStep proof={{ status: 'proving', kind: 'luma-checkin' }} onLuma={() => undefined} onEmail={() => undefined} onReset={() => undefined} />
      <EventProofStep proof={{ status: 'proven', kind: 'guest-list-email' }} onLuma={() => undefined} onEmail={() => undefined} onReset={() => undefined} />
      <EventProofStep proof={{ status: 'failed', kind: 'luma-checkin', reason: 'No checked-in ticket for this event on your Luma account.' }} onLuma={() => undefined} onEmail={() => undefined} onReset={() => undefined} />
    </Stack>
  ),
};
