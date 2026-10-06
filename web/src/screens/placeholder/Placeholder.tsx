import type { RouteDef } from '../../config/routes';
import { PublicShell } from '../../ui/shells/PublicShell';
import { Container, Heading, Link, Stack, Text } from '../../ui/primitives';

/** Generic page for M1 routes whose screen is not built yet. */
export function Placeholder({ route }: { route: RouteDef }) {
  return (
    <PublicShell>
      <Container width="app">
        <Stack gap={4} align="start">
          <Heading level={1}>{route.label}</Heading>
          <Text tone="secondary">This page is not built yet. Tag: {route.tag}.</Text>
          <Link href="/">Back to home</Link>
        </Stack>
      </Container>
    </PublicShell>
  );
}
