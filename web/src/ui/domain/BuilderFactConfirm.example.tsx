import type { WorkbenchExample } from '../../system/example';
import { BuilderFactConfirm } from './BuilderFactConfirm';

// Fact from canvas board BB-2-Origin (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, issue #50).
export const example: WorkbenchExample = {
  id: 'D14',
  name: 'BuilderFactConfirm',
  description: 'A found fact with That\'s right / Not quite; the choice can be changed.',
  render: () => <BuilderFactConfirm source="jamjam.tech" fact="JamJam first launched in 2023: artists opted in and were paid each time someone generated in their style." />,
};
