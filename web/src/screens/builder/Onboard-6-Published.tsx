/*
 * Data contract: Onboard-6-Published and its error variant Kit-RegisterFailed (canvas
 * https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Onboard-6-Published and Kit-RegisterFailed, notes n-ob6, n-krf;
 * issue #50). Backend map §4, row "Onboard-6-Published, Kit-RegisterFailed" (POST …/kit/approve, POST
 * /api/registrations/:id/retry -> kit_versions, registrations; SAS attestation by the Registrar). Shape: PublishedData.
 *
 * | Field        | Source                                                            | Empty                           |
 * |--------------|-------------------------------------------------------------------|---------------------------------|
 * | brand        | brands, profiles                                                  | never                           |
 * | status       | registrations.status: registered or failed                        | n/a                             |
 * | version/hash | kit_versions.version, kit_versions.hash (SHA-256 of canonical JSON) | never: the kit is approved    |
 * | approvedBy   | decisions (owner email, date, time)                               | never                           |
 * | sections     | kit_sections counts: gates approved, confirmed, missing           | n/a                             |
 * | tx           | registrations.signature (explorer link)                           | "Not yet" with lastTry          |
 * | reason       | registrations.error in plain words                                | n/a                             |
 * | errorDetails | registrations.error, full, for "Copy error details"               | n/a                             |
 *
 * States: success (registered) on Onboard-6; error (kit approved and saved, registration failed: Retry, Copy error details,
 * or continue unregistered) on Kit-RegisterFailed. Only hash, version and approver go onchain (note n-ob6.3).
 */
import { Badge, Button, Grid, Heading, Link, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { BuilderRegistrationResult } from '../../ui/domain/BuilderRegistrationResult';
import { BuilderStep } from './BuilderStep';
import { BuilderStepFooter } from './BuilderStepFooter';
import { builderPaths, otherPaths } from './paths';
import type { PublishedData } from './types';

const nextSteps = [
  { href: otherPaths.draftReview, title: 'Write your first post', body: 'Drafted in your voice, checked, then you approve.' },
  { href: otherPaths.brandBuild, title: 'Fill the gaps', body: 'Missing sections, any time.' },
  { href: builderPaths.kitExport, title: 'Download the kit', body: 'As an aDNA folder.' },
];

export function Onboard6Published({ data }: { data: PublishedData }) {
  const registered = data.status === 'registered';
  const record = [
    { label: 'Version', value: data.version },
    { label: 'Kit hash', value: <Text as="span" variant="mono">{data.hash}</Text> },
    ...(registered ? [{ label: 'Approved by', value: data.approvedBy }, { label: 'Sections', value: data.sections }] : []),
    {
      label: 'Registered on Solana',
      value: registered ? <><Text as="span" variant="mono">{data.tx}</Text> · <Link href={otherPaths.verifyMatch}>View on explorer</Link></> : `Not yet · last try ${data.lastTry}`,
    },
  ];
  return (
    <BuilderStep
      flow={registered ? 'published' : 'registerFailed'}
      brand={data.brand}
      title={registered ? `${data.brand.name} kit ${data.version} is ready` : `Kit ${data.version} is approved, but not registered yet`}
      flag={<Badge tone="solid">Approved</Badge>}
      footer={!registered && <BuilderStepFooter><Button href={otherPaths.draftReview} variant="secondary">Continue without registering</Button></BuilderStepFooter>}
    >
      <BuilderRegistrationResult
        status={data.status}
        items={record}
        reason={data.reason}
        errorDetails={data.errorDetails}
        retryHref={builderPaths.published}
        note={registered ? 'Only the hash, version and approver are written onchain. The kit itself stays private to your workspace.' : undefined}
      />
      {registered && (
        <>
          <Heading level={2} size="xl">Next</Heading>
          <Grid min="sm" gap={4}>
            {nextSteps.map((s) => (
              <Card key={s.href} href={s.href}><strong>{s.title}</strong><Text as="span" variant="small" tone="secondary">{s.body}</Text></Card>
            ))}
          </Grid>
          <Text variant="small" tone="secondary">Prototype states: <Link href={builderPaths.registerFailed}>registration fails</Link></Text>
        </>
      )}
    </BuilderStep>
  );
}
