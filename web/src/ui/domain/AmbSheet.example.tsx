import type { WorkbenchExample } from '../../system/example';
import { Button, Text } from '../primitives';
import { useDisclosure } from '../hooks/useDisclosure';
import { AmbSheet } from './AmbSheet';

function Demo() {
  const sheet = useDisclosure();
  return (
    <>
      <Button variant="secondary" onClick={sheet.show} aria-haspopup="dialog">Open receipt</Button>
      <AmbSheet open={sheet.open} onClose={sheet.hide} title="Receipt">
        <Text>10 USDC · 17:05 · [onchain receipt link]</Text>
      </AmbSheet>
    </>
  );
}

export const example: WorkbenchExample = {
  id: 'C18',
  name: 'AmbSheet',
  description: 'Closed until opened; a bottom sheet on narrow screens and a side panel on wide ones (canvas notes n-m3, n-m5). Escape closes.',
  render: Demo,
};
