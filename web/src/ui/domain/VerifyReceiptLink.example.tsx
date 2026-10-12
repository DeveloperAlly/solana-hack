import type { WorkbenchExample } from '../../system/example';
import { Stack } from '../primitives';
import { VerifyReceiptLink } from './VerifyReceiptLink';

export function VerifyReceiptLinkDemo() {
  return (
    <Stack gap={2}>
      <span>Confirmed: <VerifyReceiptLink signature="SampleSignatureNotOnChain">transaction</VerifyReceiptLink></span>
      <span>Pending: <VerifyReceiptLink signature={null} /></span>
    </Stack>
  );
}

export const example: WorkbenchExample = {
  id: 'D32',
  name: 'VerifyReceiptLink',
  description: 'Confirmed (Solana Explorer, devnet) and pending ([tx]).',
  render: () => <VerifyReceiptLinkDemo />,
};
