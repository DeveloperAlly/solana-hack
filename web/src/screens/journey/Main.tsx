/*
 * Data contract: Main, landing v3 (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Main; issue #48).
 * Shape: MainData in ./types. Backend map: .agentic/what/context/backend_map.md §4, row "Main".
 *
 * | Field             | Source                                                                                         | Empty when |
 * |-------------------|------------------------------------------------------------------------------------------------|------------|
 * | chip, headline, intro, howSteps, features, builtInPublic | Static copy (canvas board Main)                         | never      |
 * | siteDefault       | Client: the address the visitor types; carried to J1 (decision D1, no sign-up first)           | blank field |
 * | example           | JamJam's own kit v1 and launch post: GET /api/ledger (web/worker/api.ts, ledger) filtered to the JamJam brand, plus GET /api/brands/:id for the kit text | null until #36 registers them: the panel is hidden, never faked |
 *
 * States (canvas note n-main): success = example shown; empty = example hidden (not registered yet); error = an invalid
 * address shows inline under the field. "Site unreachable" is not a Main state: it continues to J1, which offers paste or upload.
 */
import { useNavigate } from 'react-router';
import { PublicShell } from '../../ui/shells/PublicShell';
import { Badge, Button, Container, Grid, Heading, Link, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { JourneyInlineForm } from '../../ui/domain/JourneyInlineForm';
import { JourneyQuote } from '../../ui/domain/JourneyQuote';
import { JourneySplit } from '../../ui/domain/JourneySplit';
import { JourneyStepCards } from '../../ui/domain/JourneyStepCards';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { journeyPaths, publicNavHref } from './paths';
import { MainExamplePanel } from './MainExamplePanel';
import { siteUrl } from './validators';
import type { MainData } from './types';

export interface MainProps {
  data: MainData;
  state?: ScreenState;
}

export function Main({ data, state = 'success' }: MainProps) {
  const navigate = useNavigate();
  return (
    <PublicShell navHref={publicNavHref}>
      <Container width="app">
        <Stack gap={10}>
          <JourneySplit
            ratio="6-5"
            first={
              <Stack gap={4}>
                <Badge>{data.chip}</Badge>
                <Heading level={1} size="4xl">{data.headline}</Heading>
                <Text tone="secondary">{data.intro}</Text>
                {/* INTEGRATION: none here; J1 starts the read with POST /api/brands then POST /api/brands/:id/sources {url}. */}
                <JourneyInlineForm key={state} label="Your website" submitLabel="Read my site" defaultValue={data.siteDefault} type="url" autoComplete="url" validate={siteUrl} showErrorsNow={state === 'error'} onSubmit={() => navigate(journeyPaths.read)} />
                <Text variant="small" tone="secondary">
                  No sign-up to see what we find. No website? <Link href={journeyPaths.basics}>Start with a few questions</Link>. No wallet, ever.
                </Text>
              </Stack>
            }
            second={data.example && <MainExamplePanel example={data.example} />}
          />
          <Stack as="section" id="how" gap={5} aria-labelledby="main-how">
            <Heading level={2} id="main-how">What happens in the next few minutes</Heading>
            <JourneyStepCards label="Steps" items={data.howSteps} />
            <div><Button href={journeyPaths.read}>Read my site</Button></div>
          </Stack>
          <Grid min="sm" gap={5}>
            {data.features.map((f) => (
              <Card key={f.title} as="div">
                <Heading level={3} size="lg">{f.title}</Heading>
                <Text variant="small" tone="secondary">{f.body}</Text>
                {f.quote && <JourneyQuote size="xs">{f.quote}</JourneyQuote>}
              </Card>
            ))}
          </Grid>
          <Card variant="subtle" labelledBy="main-public">
            <Heading level={2} size="xl" id="main-public">Built in public</Heading>
            <Text tone="secondary">{data.builtInPublic}</Text>
            <div><Button variant="secondary" href={journeyPaths.ledger}>See JamJam's ledger</Button></div>
          </Card>
          <Stack as="footer" direction="row" gap={5} wrap>
            <Text as="span" variant="small" tone="secondary">jamjam.tech</Text>
            <Link href={journeyPaths.proof}>Check a post</Link>
            <Link href={journeyPaths.ledger}>Public ledger</Link>
            <Text as="span" variant="small" tone="secondary">Ambassadors: coming soon</Text>
          </Stack>
        </Stack>
      </Container>
    </PublicShell>
  );
}
