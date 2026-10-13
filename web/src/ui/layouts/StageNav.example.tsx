import type { WorkbenchExample } from '../../system/example';
import { StageNav } from './StageNav';

// The main nav of every canvas v21 app board (config/nav.ts; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
export const example: WorkbenchExample = {
  id: 'L2',
  name: 'StageNav',
  description: 'Today and the six loop steps, a divider, then Inbox and Settings, from config/nav.ts; Verify is current.',
  render: () => <StageNav current="verify" label="Main nav example" />,
};
