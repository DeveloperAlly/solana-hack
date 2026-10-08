import { PublicShell } from '../../ui/shells/PublicShell';
import { Badge, Box, Button, Container, Grid, Heading, Link, Stack, Text } from '../../ui/primitives';
import { INTERVIEW_MINUTES } from '../build/steps';

const sample = [
  { name: 'Purpose', state: 'Approved' },
  { name: 'Positioning', state: 'Approved' },
  { name: 'Audience', state: 'Drafted, confirm' },
  { name: 'Voice', state: 'Approved' },
  { name: 'Origin and messaging', state: 'Drafted, confirm' },
];
const steps = [
  { title: 'Build your brand', body: 'We read your site and links first and show what we found beside each question. Short answers. Skip anything and come back later.' },
  { title: 'Approve your kit', body: 'You sign off three things: purpose, positioning and voice. Every fact shows where it came from; anything we drafted waits for you.' },
  { title: 'Start creating', body: 'Draft posts in your voice. Each one is checked for AI slop and fit before you see it. Nothing goes out until you approve it.' },
];

/** Landing (Main): one value prop, build your brand then start creating (R5). */
export function Landing() {
  return (
    <PublicShell>
      <Container width="app">
        <Stack gap={10}>
          <Grid min="lg" gap={8}>
            <Stack gap={5} align="start" justify="center">
              <Heading level={1} size="4xl">Build your brand. Then start creating.</Heading>
              <Text>Answer a few questions and link what you already have. You get a brand kit: purpose, positioning, audience and voice. Then draft posts in that voice, checked before you see them, and approve what goes out.</Text>
              <Button href="/sign-in">Build my brand</Button>
              {/* Each claim is backed by the product: the step config sets the minutes, Basics needs only a name, and the
                  server Registrar signs registrations (ADR-006). How it works explains all three. */}
              <Text variant="small" tone="secondary">About {INTERVIEW_MINUTES} minutes of questions. No website yet? A name is enough. No wallet needed: <Link href="/how-it-works">see how it works</Link>.</Text>
            </Stack>
            <Box padding={5} border="default" radius="box" aria-label="Example brand kit">
              <Stack gap={3}>
                <Stack direction="row" justify="between" align="center" wrap gap={2}>
                  <Text variant="label">Your brand kit</Text>
                  <Badge>Sample</Badge>
                </Stack>
                <Stack as="ul" gap={2}>
                  {sample.map((s) => (
                    <li key={s.name}>
                      <Stack direction="row" justify="between" align="center" gap={2} wrap>
                        <Text>{s.name}</Text>
                        <Badge tone={s.state === 'Approved' ? 'solid' : 'neutral'}>{s.state}</Badge>
                      </Stack>
                    </li>
                  ))}
                </Stack>
                <Box padding={4} background="subtle" radius="box">
                  <Stack gap={2}>
                    <Text variant="label">First draft, in your voice</Text>
                    <Text variant="small" tone="secondary">A sample post drafted from the kit, with its voice-fit score and slop check, waiting for your approval.</Text>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Grid>

          <Stack as="section" gap={5} aria-labelledby="how">
            <Heading level={2} id="how">How it works</Heading>
            <Grid min="sm">
              {steps.map((s, i) => (
                <Box key={s.title} padding={5} border="default" radius="box">
                  <Stack gap={2}>
                    <Text variant="label">{i + 1}. {s.title}</Text>
                    <Text tone="secondary">{s.body}</Text>
                  </Stack>
                </Box>
              ))}
            </Grid>
          </Stack>

          <Box as="section" padding={6} background="subtle" radius="box">
            <Grid min="md">
              <Stack gap={2} align="start">
                <Heading level={2} size="xl">Proof built in</Heading>
                <Text tone="secondary">Your approved kit and approved posts are registered on Solana, so anyone can check what really came from you. Only fingerprints go on chain; your content stays yours.</Text>
                <Link href="/verify">Check a post</Link>
              </Stack>
              <Stack gap={2} align="start">
                <Heading level={2} size="xl">Writing for a brand?</Heading>
                <Text tone="secondary">Ambassador campaigns, paid in USDC for each verified post, are coming soon.</Text>
                <Link href="/ledger">See the public ledger</Link>
              </Stack>
            </Grid>
          </Box>
        </Stack>
      </Container>
    </PublicShell>
  );
}
