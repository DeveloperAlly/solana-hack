import type { WorkbenchExample } from '../../system/example';
import { ExampleGrid } from '../../system/ExampleLayout';
import { HubWatermarkMedia } from './HubWatermarkMedia';

export const example: WorkbenchExample = {
  id: 'D46',
  name: 'HubWatermarkMedia',
  description: 'Watermark present, and missing (blocks approval).',
  render: () => (
    <ExampleGrid>
      <HubWatermarkMedia label="[Avatar at the writing desk]" />
      <HubWatermarkMedia label="[Avatar image]" stamped={false} />
    </ExampleGrid>
  ),
};
