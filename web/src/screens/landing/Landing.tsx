import { PublicShell } from '../../ui/shells/PublicShell';
import { Button, Container, Heading, Stack } from '../../ui/primitives';

/** Landing (S0): heading and the primary action only. */
export function Landing() {
  return (
    <PublicShell>
      <Container width="app">
        <Stack gap={6} align="start">
          <Heading level={1}>Build your brand. Then start creating.</Heading>
          <Button href="/sign-in">Build my brand</Button>
        </Stack>
      </Container>
    </PublicShell>
  );
}
