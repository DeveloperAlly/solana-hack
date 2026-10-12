import { Alert, Button, Stack } from '../../../ui/primitives';
import { useDisclosure } from '../../../ui/hooks/useDisclosure';

/**
 * The canvas's Withdraw button (Amb-5b, M-5). The backend map row "Amb-5a, 5b, 5c, 5d, M-5" and ADR-006 say there is no
 * withdraw: payouts go straight to the ambassador's own wallet. So the button explains that instead of pretending to move
 * money. The canvas still draws Withdraw; the PR flags the drift (AGENTS rule 8).
 */
export function WithdrawControl() {
  const info = useDisclosure();
  return (
    <Stack gap={2} align="start">
      <Button variant="secondary" onClick={info.toggle} aria-expanded={info.open}>Withdraw</Button>
      {info.open && <Alert tone="info">Payouts go straight to your own wallet, so there is nothing to withdraw.</Alert>}
    </Stack>
  );
}
