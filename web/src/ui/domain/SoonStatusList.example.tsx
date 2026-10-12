import type { WorkbenchExample } from '../../system/example';
import { SoonStatusList } from './SoonStatusList';
import { SoonStatusRow } from './SoonStatusRow';

export const example: WorkbenchExample = {
  id: 'D-UI5',
  name: 'SoonStatusList',
  description: 'The labelled list that holds status rows.',
  render: () => (
    <SoonStatusList label="Brands">
      <SoonStatusRow name="JamJam" detail="jamjam.tech" status={{ label: 'Self-declared' }} />
      <SoonStatusRow name="aDNA" detail="adna.network" status={{ label: 'Domain verified', tone: 'solid' }} />
    </SoonStatusList>
  ),
};
