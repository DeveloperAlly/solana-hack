import { AppShell } from '../../ui/shells/AppShell';
import { Badge, Container, Heading, Stack, Text } from '../../ui/primitives';
import type { RouteDef } from '../../config/routes';

const copy: Record<string, string> = {
  '/grow': 'Run campaigns with ambassadors who write in your voice, verify their posts, and pay them in USDC per verified post.',
  '/inbox': 'Replies and mentions across your channels in one queue, with drafts in your voice waiting for your approval.',
  '/analytics': 'What your approved posts did, by channel and by message.',
};

/** Hub screens tagged coming soon or roadmap: say what they will do, build nothing pretend. */
export function ComingSoon({ route }: { route: RouteDef }) {
  return (
    <AppShell>
      <Container width="reading">
        <Stack gap={4} align="start">
          <Stack direction="row" gap={3} align="center" wrap>
            <Heading level={1}>{route.label}</Heading>
            <Badge>{route.tag === 'ROADMAP' ? 'Roadmap' : 'Coming soon'}</Badge>
          </Stack>
          <Text>{copy[route.path] ?? 'This part of Waterlily is not built yet.'}</Text>
        </Stack>
      </Container>
    </AppShell>
  );
}
