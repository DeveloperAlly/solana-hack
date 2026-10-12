import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { Card } from '../composites/Card';
import { AmbColumns } from './AmbColumns';

export const example: WorkbenchExample = {
  id: 'L9',
  name: 'AmbColumns',
  description: 'Main and aside (canvas Amb-2), and rail, main, rail (Amb-3); both stack on narrow screens.',
  render: () => (
    <Stack gap={4}>
      <AmbColumns layout="main-aside">
        <Card as="div">Main</Card>
        <Card as="div" variant="subtle">Aside</Card>
      </AmbColumns>
      <AmbColumns layout="rail-main-rail">
        <Card as="div" variant="subtle">Rail</Card>
        <Card as="div">Main</Card>
        <Card as="div" variant="subtle">Rail</Card>
      </AmbColumns>
    </Stack>
  ),
};
