import type { WorkbenchExample } from '../../system/example';
import { Text } from '../primitives';
import { SoonHubFrame } from './SoonHubFrame';

export const example: WorkbenchExample = {
  id: 'D-UI5',
  name: 'SoonHubFrame',
  description: 'L1 AppShell with the D48 brand switcher, the page header and a body (preview: no second main).',
  render: () => (
    <SoonHubFrame preview header={{ titleLevel: 4, title: 'Claims', intro: 'Every factual claim your posts may make.', definedIn: 'component inventory D19' }}>
      <Text>Body content.</Text>
    </SoonHubFrame>
  ),
};
