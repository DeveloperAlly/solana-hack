import { useState } from 'react';
import type { WorkbenchExample } from '../../system/example';
import { JourneyClaimText } from './JourneyClaimText';

// Draft from canvas board J6-First-Post (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn; issue #48).
function Demo() {
  const [sel, setSel] = useState('check');
  return (
    <JourneyClaimText
      selected={sel}
      onSelect={setSel}
      segments={[
        { text: 'So JamJam reads first. It shows you each fact with the line it came from, ' },
        { text: 'drafts posts in your voice', claimId: 'voice' },
        { text: ', and waits for you to approve them. ' },
        { text: 'Anyone can check what really came from you', claimId: 'check' },
        { text: '.' },
      ]}
    />
  );
}

export const example: WorkbenchExample = {
  id: 'D82',
  name: 'JourneyClaimText',
  description: 'Two claims; the second is selected. Click a claim to select it.',
  render: () => <Demo />,
};
