/*
 * Data contract: Main, landing v3 (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Main; issue #48).
 * Shape: MainData in ./types. Backend map: .agentic/what/context/backend_map.md §4, row "Main".
 *
 * | Field             | Source                                                                                         | Empty when |
 * |-------------------|------------------------------------------------------------------------------------------------|------------|
 * | chip, headline, intro, howSteps, features, builtInPublic | Static copy (canvas board Main)                         | never      |
 * | siteDefault       | Client: an address carried in (blank by default; the example address is a placeholder). Submitting starts the read on J1 (decision D1, no sign-up first) | blank field |
 * | sitePlaceholder   | Static copy (canvas board Main shows jamjam.tech)                                               | never      |
 * | example           | JamJam's own kit v1 and launch post: GET /api/ledger (web/worker/api.ts, ledger) filtered to the JamJam brand, plus GET /api/brands/:id for the kit text | null until #36 registers them: the panel is hidden, never faked |
 *
 * States (canvas note n-main): success = example shown; empty = example hidden (not registered yet); error = an invalid
 * address shows inline under the field. "Site unreachable" is not a Main state: it continues to J1, which offers paste or upload.
 */
import { useNavigate } from 'react-router';
import { PublicShell } from '../../ui/shells/PublicShell';
import { Badge, Button, Container, Grid, Heading, Link, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { InlineForm } from '../../ui/composites/InlineForm';
import { JourneyQuote } from '../../ui/domain/JourneyQuote';
import { Columns } from '../../ui/layouts/Columns';
import { JourneyStepCards } from '../../ui/domain/JourneyStepCards';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { useJourneyHref, useNavHref } from './paths';
import { MainExamplePanel } from './MainExamplePanel';
import { useJourneyFlow } from './useJourneyFlow';
import { siteUrl } from './validators';
import type { MainData } from './types';

export interface MainProps {
  data: MainData;
  state?: ScreenState;
}

export function Main({ data, state = 'success' }: MainProps) {
  const to = useJourneyHref();
  const navHref = useNavHref();
  const navigate = useNavigate();
  const { actions } = useJourneyFlow();
  return (
    <PublicShell navHref={navHref}>
      <Container width="app">
        <Stack gap={10}>
          <Columns
            ratio="6-5"
            gap={7}
            stackBelow="md"
            end={data.example && <MainExamplePanel example={data.example} />}
          >
              <Stack gap={4}>
                <Badge>{data.chip}</Badge>
                <Heading level={1} size="4xl">{data.headline}</Heading>
                <Text tone="secondary">{data.intro}</Text>
                {/* INTEGRATION: none here; J1 starts the read with POST /api/brands then POST /api/brands/:id/sources {url}. */}
                <InlineForm
                  key={state}
                  id="main-site"
                  layout="row"
                  fields={[{ name: 'site', label: 'Your website', type: 'url', autoComplete: 'url', defaultValue: data.siteDefault, placeholder: data.sitePlaceholder, validate: siteUrl }]}
                  submitLabel="Read my site"
                  validateOnMount={state === 'error'}
                  onSubmit={({ site }) => { actions.startJourney(site); navigate(to('read')); }}
                />
                <Text variant="small" tone="secondary">
                  No sign-up to see what we find. No website? <Link href={to('basics')}>Start with a few questions</Link>. No wallet, ever.
                </Text>
              </Stack>
          </Columns>
          <Stack as="section" id="how" gap={5} aria-labelledby="main-how">
            <Heading level={2} id="main-how">What happens in the next few minutes</Heading>
            <JourneyStepCards label="Steps" items={data.howSteps} />
            {/* The canvas repeats the action here: it submits the same site form, with the same validation. */}
            <div><Button type="submit" form="main-site">Read my site</Button></div>
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
            <div><Button variant="secondary" href={to('ledger')}>See JamJam's ledger</Button></div>
          </Card>
          <Stack as="footer" direction="row" gap={5} wrap>
            <Text as="span" variant="small" tone="secondary">jamjam.tech</Text>
            <Link href={to('proof')}>Check a post</Link>
            <Link href={to('ledger')}>Public ledger</Link>
            <Text as="span" variant="small" tone="secondary">Ambassadors: coming soon</Text>
          </Stack>
        </Stack>
      </Container>
    </PublicShell>
  );
}
