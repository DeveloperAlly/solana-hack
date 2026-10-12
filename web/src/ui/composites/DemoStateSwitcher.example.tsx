import type { WorkbenchExample } from '../../system/example';
import { DemoStateSwitcher, screenStates } from './DemoStateSwitcher';

export const example: WorkbenchExample = {
  id: 'C28',
  name: 'DemoStateSwitcher',
  description: 'All four states with loading current; each state is a link (?state=).',
  render: () => <DemoStateSwitcher states={screenStates} value="loading" hrefFor={(s) => `/system?state=${s}`} />,
};
