import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { Button, Stack } from '../primitives';
import { AmbCampaignCard } from './AmbCampaignCard';
import { AmbNotifyButton } from './AmbNotifyButton';
import { sampleCampaign, sampleClosedCampaign } from './ambSamples';

function Demo() {
  const [on, setOn] = useState(false);
  return (
    <Stack gap={4}>
      <AmbCampaignCard {...sampleCampaign} action={<Button href="/system#campaign">View</Button>} />
      <AmbCampaignCard {...sampleClosedCampaign} action={<AmbNotifyButton brand="GamersLab" on={on} onToggle={() => setOn((v) => !v)} />} />
      <AmbCampaignCard {...sampleCampaign} brandLine="aDNA" channelsLabel="LinkedIn, Blog" layout="stack" href="/system#campaign" />
      <AmbCampaignCard {...sampleClosedCampaign} brandLine="GamersLab" layout="stack" />
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'D24',
  name: 'AmbCampaignCard',
  description: 'Desktop rows, open and budget reached with Notify me (canvas Amb-1); mobile stacked cards, a link and closed (M-1).',
  render: Demo,
};
