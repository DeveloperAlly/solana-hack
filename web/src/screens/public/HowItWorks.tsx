import { PublicShell } from '../../ui/shells/PublicShell';
import { Button, Container, Heading, Stack, Text } from '../../ui/primitives';
import { INTERVIEW_MINUTES } from '../build/steps';

const parts = [
  { h: '1. We read before we ask', p: 'Paste your website or any page about you. Waterlily reads it and keeps only facts it can quote word for word from the page, each with its source. Those facts sit beside each interview question, so you can confirm them instead of retyping.' },
  { h: '2. A short interview', p: `Why you exist, what you do differently, who it is for, and how you sound. Six short steps, about ${INTERVIEW_MINUTES} minutes. Only a brand name is required; every question step after it can be skipped and finished later.` },
  { h: '3. Three decisions only you can make', p: 'The AI drafts your purpose, positioning and voice from your answers and sources, citing where each point came from. You approve each one. The approval records who and when.' },
  { h: '4. Your kit, registered', p: 'When the three gates are approved, the kit is fingerprinted and the fingerprint, version and your account id are registered on Solana. The Waterlily server key signs the registration, so you never need a wallet. The kit text stays private.' },
  { h: '5. Create in your voice', p: 'Draft posts from a one-line brief. Each draft is checked for AI slop and scored for voice fit before you see it. You approve, publish, and register the post.' },
  { h: '6. Anyone can check', p: 'Paste a post into Check a post. If it matches a registration, it is official, with the brand, kit version and approval time. Change one word and it no longer matches.' },
];

/** How it works (public). */
export function HowItWorks() {
  return (
    <PublicShell>
      <Container width="reading">
        <Stack gap={6}>
          <Heading level={1}>How it works</Heading>
          {parts.map((x) => (
            <Stack as="section" key={x.h} gap={2}>
              <Heading level={2} size="lg">{x.h}</Heading>
              <Text tone="secondary">{x.p}</Text>
            </Stack>
          ))}
          <Stack direction="row" gap={3} wrap>
            <Button href="/sign-in">Build my brand</Button>
            <Button href="/verify" variant="secondary">Check a post</Button>
          </Stack>
        </Stack>
      </Container>
    </PublicShell>
  );
}
