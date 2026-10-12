import type { WorkbenchExample } from '../../system/example';
import { Button, Heading, Text } from '../primitives';
import { Card, type CardVariant } from './Card';
import { ExampleGrid } from '../../system/ExampleLayout';

const variants: CardVariant[] = ['default', 'subtle', 'selected', 'dashed', 'emphasis'];

export const example: WorkbenchExample = {
  id: 'C1',
  name: 'Card',
  description: 'Each variant with header and footer, and a card that is a link (hover).',
  render: () => (
    <ExampleGrid>
      {variants.map((v) => (
        <Card key={v} variant={v} header={<Heading level={4}>{v}</Heading>} footer={<Button variant="secondary">Action</Button>}>
          <Text>Body text for a {v} card.</Text>
        </Card>
      ))}
      <Card href="/screens">
        <Text>Card as a link to the gallery</Text>
      </Card>
    </ExampleGrid>
  ),
};
