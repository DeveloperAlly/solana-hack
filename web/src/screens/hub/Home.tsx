import { AppShell } from '../../ui/shells/AppShell';
import { Alert, Badge, Box, Button, Container, Grid, Heading, Link, Stack, Text } from '../../ui/primitives';
import { useBrand } from '../../lib/useBrand';
import { STEPS } from '../build/steps';

/** Hub-Home: where the brand stands and the one next action. */
export function Home() {
  const { state, noBrand, error } = useBrand();
  if (noBrand) {
    return (
      <AppShell>
        <Container width="app">
          <Stack gap={5} align="start">
            <Heading level={1}>Welcome to Waterlily</Heading>
            <Text tone="secondary">Start by building your brand. It takes about 15 minutes.</Text>
            <Button href="/build/basics">Build my brand</Button>
          </Stack>
        </Container>
      </AppShell>
    );
  }
  const gates = ['purpose', 'positioning', 'voice'];
  const gatesDone = state ? gates.filter((g) => state.gates.some((x) => x.gate === g)).length : 0;
  const sectionSteps = STEPS.filter((s) => s.kind === 'section');
  const approved = state ? state.sections.filter((s) => s.status === 'approved').length : 0;
  // The newest *registered* kit, not the newest attempt: a later failed attempt must not hide a registered one.
  const kit = state?.kits.find((k) => k.status === 'registered');
  const registered = !!kit;
  const nextVersion = (state?.kits[0]?.version ?? 0) + 1;
  const next = !state ? null
    : gatesDone < 3 ? { label: 'Continue building your brand', href: '/build' }
    : !registered ? { label: `Register kit v${nextVersion}`, href: '/build/kit' }
    : { label: 'Create a post', href: '/create' };

  return (
    <AppShell brandName={state?.brand.name}>
      <Container width="app">
        <Stack gap={6}>
          <Stack gap={2}>
            <Heading level={1}>{state ? state.brand.name : 'Loading…'}</Heading>
            {state?.brand.description && <Text tone="secondary">{state.brand.description}</Text>}
          </Stack>
          {error && <Alert tone="danger">{error}</Alert>}
          {next && (
            <Box padding={5} background="subtle" radius="box">
              <Stack direction="row" gap={4} wrap align="center" justify="between">
                <Text variant="label">Next: {next.label}</Text>
                <Button href={next.href}>{next.label}</Button>
              </Stack>
            </Box>
          )}
          {state && (
            <Grid min="sm">
              <Card title="Brand kit" value={registered ? `v${kit!.version} registered` : 'Not registered'} badge={registered ? 'success' : 'warning'} link={{ href: '/brand', label: 'View kit' }} />
              <Card title="Decision gates" value={`${gatesDone} of 3 approved`} badge={gatesDone === 3 ? 'success' : 'warning'} link={{ href: '/build', label: 'Open intake' }} />
              <Card title="Sections" value={`${approved} of ${sectionSteps.length} approved`} badge={approved === sectionSteps.length ? 'success' : 'warning'} link={{ href: '/brand', label: 'Review' }} />
              <Card title="Evidence" value={`${state.evidence.length} facts from ${state.sources.filter((s) => s.status === 'read').length} pages and your answers`} link={{ href: '/build/sources', label: 'Add a link' }} />
            </Grid>
          )}
          {registered && kit?.signature && (
            <Text variant="small" tone="secondary">
              Kit v{kit.version} fingerprint <Text as="span" variant="mono">{kit.hash.slice(0, 22)}…</Text>{' '}
              <Link href={`https://explorer.solana.com/tx/${kit.signature}?cluster=devnet`} external>on Solana Explorer</Link>
            </Text>
          )}
        </Stack>
      </Container>
    </AppShell>
  );
}

function Card({ title, value, badge, link }: { title: string; value: string; badge?: 'success' | 'warning'; link: { href: string; label: string } }) {
  return (
    <Box padding={5} border="default" radius="box">
      <Stack gap={3} align="start">
        <Stack direction="row" gap={2} align="center" wrap>
          <Heading level={2} size="lg">{title}</Heading>
          {badge && <Badge tone={badge}>{badge === 'success' ? 'Done' : 'To do'}</Badge>}
        </Stack>
        <Text>{value}</Text>
        <Link href={link.href}>{link.label}</Link>
      </Stack>
    </Box>
  );
}
