import type { WorkbenchExample } from '../../system/example';
import { Button } from '../primitives';
import { ExampleGrid } from '../../system/ExampleLayout';
import { JourneyFactCard, type JourneyFact } from './JourneyFactCard';

// Sample facts from canvas board J3-Confirm (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn; issue #48).
const found: JourneyFact = {
  id: 'positioning',
  section: 'Positioning · Gate 2',
  status: 'found',
  statement: 'JamJam builds a brand kit, then drafts posts in that voice.',
  quote: 'Build your brand. Then start creating.',
  source: { label: 'jamjam.tech · home page', url: 'https://jamjam.tech' },
};
const partly: JourneyFact = { id: 'voice', section: 'Voice · Gate 3', status: 'partly', statement: 'Plain, direct, second person, no hype.', note: 'Inferred from 3 pages.' };
const missing: JourneyFact = { id: 'audience', section: 'Audience · Origin', status: 'needs-you', statement: "Nothing on your pages says who it's for or why you started it." };

export const example: WorkbenchExample = {
  id: 'D14',
  name: 'JourneyFactCard',
  description: 'Found with quote and actions, accepted, partly found, and needs you (dashed).',
  render: () => (
    <ExampleGrid>
      <JourneyFactCard fact={found} actions={<><Button>Accept</Button><Button variant="secondary">Edit</Button></>} />
      <JourneyFactCard fact={found} decision="Accepted" />
      <JourneyFactCard fact={partly} />
      <JourneyFactCard fact={missing} variant="dashed" />
    </ExampleGrid>
  ),
};
