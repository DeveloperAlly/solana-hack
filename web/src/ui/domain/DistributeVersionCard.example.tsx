import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Grid, Select } from '../primitives';
import { DistributeVersionCard } from './DistributeVersionCard';

// Copy from canvas v21 Distribute-Adapt (X, LinkedIn and Threads versions of one aDNA post).
const pass = { blocking: false, label: 'Checks passed' };

function Live() {
  const [text, setText] = useState('Your agent didn’t forget. It was never told. Here’s the fix, in one folder.');
  const [approved, setApproved] = useState(false);
  return (
    <DistributeVersionCard
      platform="Threads"
      text={text}
      length={{ used: [...text].length, max: 500 }}
      check={pass}
      approval={approved ? { label: 'Approved', tone: 'solid', approved: true } : { label: 'Needs your approval', tone: 'neutral', approved: false }}
      note="Planned platform: copy and paste only"
      onSave={(t) => { setText(t); setApproved(false); }}
      onApprove={() => setApproved(true)}
    />
  );
}

export const example: WorkbenchExample = {
  id: 'D92',
  name: 'DistributeVersionCard',
  description: 'One platform version: needs approval (interactive), approved with schedule controls, blocked by a check.',
  render: () => (
    <Grid min="sm">
      <Live />
      <DistributeVersionCard
        platform="X"
        text="Your agent didn’t forget. It was never told. Every new session starts blank because project context lives in people’s heads…"
        length={{ used: 231, max: 280 }}
        check={pass}
        approval={{ label: 'Approved', tone: 'solid', approved: true }}
        onSave={() => undefined}
        onApprove={() => undefined}
      >
        <Select label="When" options={['Tue 09:30 (best time)', 'Now']} />
      </DistributeVersionCard>
      <DistributeVersionCard
        platform="LinkedIn"
        text="Your agent didn’t forget. It was never told."
        length={null}
        check={{ blocking: true, label: 'a claim has no source' }}
        approval={{ label: 'Needs your approval', tone: 'neutral', approved: false }}
        onSave={() => undefined}
        onApprove={() => undefined}
      />
    </Grid>
  ),
};
