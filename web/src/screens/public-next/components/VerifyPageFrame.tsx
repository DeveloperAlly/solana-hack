import type { ReactNode } from 'react';
import { PublicShell } from '../../../ui/shells/PublicShell';
import { Container, Stack } from '../../../ui/primitives';

/** The public page frame every Verify and Ledger screen sits in: public nav (L10), app width, canvas spacing. */
export function VerifyPageFrame({ children }: { children: ReactNode }) {
  return (
    <PublicShell>
      <Container width="app">
        <Stack gap={6}>{children}</Stack>
      </Container>
    </PublicShell>
  );
}
