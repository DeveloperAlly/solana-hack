import { useEffect, useState } from 'react';
import { AppShell } from '../../ui/shells/AppShell';
import { Alert, Badge, Box, Container, Heading, Stack, Text } from '../../ui/primitives';
import { useBrand } from '../../lib/useBrand';

interface Health { registrar: string | null; rpcConfigured: boolean; model?: string; aiConfigured?: boolean }

function Row({ name, status, tone, detail }: { name: string; status: string; tone: 'success' | 'warning' | 'neutral'; detail: string }) {
  return (
    <Stack direction="row" gap={3} wrap justify="between" align="center">
      <Stack gap={1}>
        <Text variant="label">{name}</Text>
        <Text variant="small" tone="secondary">{detail}</Text>
      </Stack>
      <Badge tone={tone}>{status}</Badge>
    </Stack>
  );
}

/** Settings: publishing connections, AI model, proof layer, plan and account. Honest about what is live. */
export function Settings() {
  const { state, email } = useBrand();
  const [health, setHealth] = useState<Health | null>(null);
  const [healthFailed, setHealthFailed] = useState(false);
  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then(setHealth).catch(() => setHealthFailed(true));
  }, []);
  return (
    <AppShell brandName={state?.brand.name}>
      <Container width="reading">
        <Stack gap={6}>
          <Heading level={1}>Settings</Heading>
          <Box as="section" padding={5} border="default" radius="box" aria-labelledby="h-pub">
            <Stack gap={4}>
              <Heading level={2} size="lg" id="h-pub">Publishing</Heading>
              <Row name="Copy and paste back" status="On" tone="success" detail="Copy an approved post, publish it yourself, then paste its link so it can be verified." />
              <Row name="X" status="Coming soon" tone="neutral" detail="Connect with OAuth and publish approved posts directly. Tokens stay on the server." />
              <Row name="LinkedIn" status="Coming soon" tone="neutral" detail="Publish approved posts to your profile." />
              <Text variant="small" tone="secondary">Nothing is ever posted without your approval.</Text>
            </Stack>
          </Box>
          <Box as="section" padding={5} border="default" radius="box" aria-labelledby="h-ai">
            <Stack gap={4}>
              <Heading level={2} size="lg" id="h-ai">AI model</Heading>
              <Row name="Default model" status={health?.aiConfigured === true ? 'On' : health?.aiConfigured === false ? 'Not configured' : 'Unknown'} tone={health?.aiConfigured === true ? 'success' : 'warning'} detail={`Through OpenRouter: ${health?.model ?? 'openrouter/auto'}. Every draft passes the no-AI-slop rules before you see it.`} />
              <Row name="Bring your own key (Claude, OpenAI)" status="Coming soon" tone="neutral" detail="Use your own model account for drafting." />
            </Stack>
          </Box>
          <Box as="section" padding={5} border="default" radius="box" aria-labelledby="h-proof">
            <Stack gap={4}>
              <Heading level={2} size="lg" id="h-proof">Proof on Solana</Heading>
              <Row name="Registrar" status={health?.registrar ? 'On (devnet)' : 'Unknown'} tone={health?.registrar ? 'success' : 'warning'} detail={health?.registrar ? `Waterlily signs registrations for you from ${health.registrar}. You never need a wallet to register.` : healthFailed ? 'Could not reach the server.' : 'Checking…'} />
              <Row name="Payout wallet" status="Coming soon" tone="neutral" detail="Link a wallet only if you pay ambassadors in USDC." />
            </Stack>
          </Box>
          <Box as="section" padding={5} border="default" radius="box" aria-labelledby="h-acct">
            <Stack gap={4}>
              <Heading level={2} size="lg" id="h-acct">Plan and account</Heading>
              <Row name="Plan" status="Trial" tone="neutral" detail="Billing is not switched on during the hackathon." />
              <Row name="Signed in as" status="Email code" tone="success" detail={email || '…'} />
            </Stack>
          </Box>
          {healthFailed && <Alert tone="warning">Could not read the server status.</Alert>}
        </Stack>
      </Container>
    </AppShell>
  );
}
