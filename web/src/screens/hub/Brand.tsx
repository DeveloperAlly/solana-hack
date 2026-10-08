import { AppShell } from '../../ui/shells/AppShell';
import { Alert, Badge, Box, Button, Container, Heading, Link, Stack, Text } from '../../ui/primitives';
import { useBrand } from '../../lib/useBrand';
import { STEPS } from '../build/steps';
import type { BrandState } from '../build/Build';

const sectionSteps = STEPS.filter((s) => s.kind === 'section');

/**
 * aDNA-style export (architecture §8) as one Markdown file: a frontmatter block per section, gates as decisions,
 * sources. When a kit is registered, the sections and gates come from that version's stored snapshot, so the
 * exported text is exactly what the advertised fingerprint covers. With no registered kit it is a labelled draft.
 */
export function kitMarkdown(s: BrandState): string {
  const kit = s.kits.find((k) => k.status === 'registered' && k.payload);
  const sections = kit?.payload?.sections ?? s.sections;
  const gates = kit?.payload?.gates ?? s.gates;
  const changed = !!kit && s.sections.some((live) => sections.find((x) => x.section === live.section)?.body !== live.body);
  const lines = [
    // The registered name is part of the hash; a later rename does not change what this version says.
    `# ${kit?.payload?.brand?.name ?? s.brand.name} brand kit`,
    '',
    `version: ${kit ? kit.version : 'draft (not registered)'}  `,
    `fingerprint: ${kit?.hash ?? 'not registered'}  `,
    kit?.signature ? `registration: https://explorer.solana.com/tx/${kit.signature}?cluster=devnet` : '',
    changed ? `note: sections edited since v${kit!.version} are not in this export; register a new version to include them.` : '',
    '',
    '## what/brand',
  ];
  for (const step of sectionSteps) {
    const sec = sections.find((x) => x.section === step.section);
    if (!sec) continue;
    lines.push('', '---', `section: ${step.section}`, `status: ${sec.status}`, `citations: ${sec.citations.length}`, '---', `### ${step.title.replace(/^Gate \d: /, '')}`, '', sec.body);
  }
  lines.push('', '## what/decisions');
  for (const g of gates) lines.push(`- ${g.gate}: approved ${g.approved_at}${'note' in g && g.note ? ` (${g.note})` : ''}`);
  lines.push('', '## what/context/sources');
  // A registered export lists the sources recorded in that version; only a draft export lists the live ones.
  for (const src of kit ? kit.payload?.sources ?? s.sources : s.sources) lines.push(`- ${src.title || src.url}: ${src.url} (${src.status})`);
  return lines.filter((l) => l !== undefined).join('\n') + '\n';
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Brand (Brand-Build view): the kit, section by section, with status, evidence counts, gates and versions. */
export function Brand() {
  const { state, noBrand, error } = useBrand();
  return (
    <AppShell brandName={state?.brand.name}>
      <Container width="reading">
        <Stack gap={6}>
          <Stack direction="row" gap={4} wrap justify="between" align="center">
            <Heading level={1}>Brand kit</Heading>
            {state && <Button variant="secondary" onClick={() => download(`${state.brand.name.toLowerCase().replace(/\W+/g, '-')}-kit.md`, kitMarkdown(state))}>Export (aDNA Markdown)</Button>}
          </Stack>
          {error && <Alert tone="danger">{error}</Alert>}
          {noBrand && <Alert tone="info" title="No brand yet"><Link href="/build/basics">Build your brand</Link> first.</Alert>}
          {state && state.kits[0] && (
            <Alert tone={state.kits[0].status === 'registered' ? 'success' : 'info'} title={`Kit v${state.kits[0].version}: ${state.kits[0].status}`}>
              <Text as="span" variant="mono">{state.kits[0].hash}</Text>
            </Alert>
          )}
          {state && sectionSteps.map((step) => {
            const sec = state.sections.find((x) => x.section === step.section);
            const gate = step.gate && state.gates.find((g) => g.gate === step.gate);
            return (
              <Box as="section" key={step.slug} padding={5} border="default" radius="box" aria-labelledby={`h-${step.slug}`}>
                <Stack gap={3}>
                  <Stack direction="row" gap={2} wrap align="center">
                    <Heading level={2} size="lg" id={`h-${step.slug}`}>{step.title.replace(/^Gate \d: /, '')}</Heading>
                    <Badge tone={sec?.status === 'approved' ? 'success' : sec ? 'warning' : 'neutral'}>{sec ? (sec.status === 'approved' ? 'Approved' : 'Drafted') : 'Not drafted'}</Badge>
                    {step.gate && <Badge tone="solid">Gate</Badge>}
                  </Stack>
                  {sec ? <Text>{sec.body}</Text> : <Text tone="secondary">Not drafted yet.</Text>}
                  <Text variant="small" tone="secondary">
                    {sec ? `${sec.citations.length} cited fact${sec.citations.length === 1 ? '' : 's'}` : ''}
                    {gate ? ` · approved ${new Date(gate.approved_at).toLocaleString()}` : ''}
                  </Text>
                  <Link href={`/build/${step.slug}`}>{sec ? 'Edit or redraft' : 'Draft it'}</Link>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Container>
    </AppShell>
  );
}
