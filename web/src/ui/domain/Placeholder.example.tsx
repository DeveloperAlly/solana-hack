import type { WorkbenchExample } from '../../system/example';
import { ExampleGrid } from '../../system/ExampleLayout';
import { Placeholder, type PlaceholderRatio } from './Placeholder';

const ratios: PlaceholderRatio[] = ['square', 'landscape', 'portrait', 'wide'];

export const example: WorkbenchExample = {
  id: 'D58',
  name: 'Placeholder',
  description: 'Local SVG stand-in image in each aspect ratio.',
  render: () => (
    <ExampleGrid>
      {ratios.map((r) => <Placeholder key={r} ratio={r} label={`Sample image, ${r}`} />)}
    </ExampleGrid>
  ),
};
