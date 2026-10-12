import type { WorkbenchExample } from '../../system/example';
import { Link } from '../primitives';
import { SoonPageHeader } from './SoonPageHeader';

export const example: WorkbenchExample = {
  id: 'D-UI5',
  name: 'SoonPageHeader',
  description: 'Title with the Coming soon flag, intro, defined-in line and a header action (issue #51).',
  render: () => (
    <SoonPageHeader titleLevel={4} title="Settings" intro="Your plan, seats and billing." definedIn="component inventory D55" actions={<Link href="/screens/Settings-AI">Back</Link>} />
  ),
};
