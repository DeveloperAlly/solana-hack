import type { WorkbenchExample } from '../../system/example';
import { JourneyStepCards } from './JourneyStepCards';

// Steps from canvas board Main (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn; issue #48).
export const example: WorkbenchExample = {
  id: 'D83',
  name: 'JourneyStepCards',
  description: 'Numbered cards that wrap; three items.',
  render: () => (
    <JourneyStepCards
      label="What happens next"
      items={[
        { title: 'We read your site', body: 'Facts appear with the exact line we found them on.' },
        { title: 'You confirm', body: "Accept or fix what we found. We only ask what's missing." },
        { title: 'Pick your voice', body: 'Choose the paragraph that sounds like you. Twice.' },
      ]}
    />
  ),
};
