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
 * | approvedAt   | kit_versions.approved_at; the approver is the signed-in owner (flow) | never                         |
 * | sections     | kit_sections counts: gates approved, confirmed, missing           | n/a                             |
 * | tx           | registrations.signature -> Solana Explorer (devnet) via VerifyReceiptLink | "Not yet" with lastTry; null shows [tx signature] |
 * | reason       | registrations.error in plain words                                | n/a                             |
 * | errorDetails | registrations.error, full, for "Copy error details"               | n/a                             |
 *
 * States: success (registered) on Onboard-6; error (kit approved and saved, registration failed: Retry, Copy error details,
 * or fill the gaps while waiting; drafting posts needs a registered kit, web/worker/posts.ts) on Kit-RegisterFailed. Only hashes
 * and ids go onchain: brand, kit hash, version, approver, domain-verified flag (web/worker/api.ts).
 */
import { Badge, Button, Grid, Heading, Link, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { BuilderRegistrationResult } from '../../ui/domain/BuilderRegistrationResult';
import { VerifyReceiptLink } from '../../ui/domain/VerifyReceiptLink';
import { useBuilderFlow } from './useBuilderFlow';
import { BuilderStep } from './BuilderStep';
import { BuilderStepFooter } from './BuilderStepFooter';
import { useBoardHref, type BoardKey } from './paths';
import type { PublishedData } from './types';

const nextSteps: { board: BoardKey; title: string; body: string }[] = [
  { board: 'draftReview', title: 'Write your first post', body: 'Drafted in your voice, checked, then you approve.' },
  { board: 'brandBuild', title: 'Fill the gaps', body: 'Missing sections, any time.' },
  { board: 'kitExport', title: 'Download the kit', body: 'As an aDNA folder.' },
];

export function Onboard6Published({ data }: { data: PublishedData }) {
  const to = useBoardHref();
  const registered = data.status === 'registered';
  const { brandFor } = useBuilderFlow(registered ? 'published' : 'registerFailed');
  const brand = brandFor(data.brand);
  const record = [
    { label: 'Version', value: data.version },
    { label: 'Kit hash', value: <Text as="span" variant="mono">{data.hash}</Text> },
    ...(registered ? [{ label: 'Approved by', value: `${brand.approver}, ${data.approvedAt}` }, { label: 'Sections', value: data.sections }] : []),
    {
      label: 'Registered on Solana',
      value: registered ? <VerifyReceiptLink signature={data.tx ?? null} placeholder="[tx signature]">Registration transaction</VerifyReceiptLink> : `Not yet · last try ${data.lastTry}`,
    },
  ];
  return (
    <BuilderStep
      flow={registered ? 'published' : 'registerFailed'}
      brand={data.brand}
      title={registered ? `${brand.name} kit ${data.version} is ready` : `Kit ${data.version} is approved, but not registered yet`}
      flag={<Badge tone="solid">Approved</Badge>}
      footer={!registered && <BuilderStepFooter><Button href={to('brandBuild')} variant="secondary">Fill the gaps while you wait</Button></BuilderStepFooter>}
    >
      <BuilderRegistrationResult
        status={data.status}
        items={record}
        reason={data.reason}
        errorDetails={data.errorDetails}
        retryHref={to('published')}
        note={registered ? 'Only hashes and ids (brand, kit hash, version, approver, domain-verified flag) go onchain. The kit itself stays private to your workspace.' : undefined}
      />
      {registered && (
        <>
          <Heading level={2} size="xl">Next</Heading>
          <Grid min="sm" gap={4}>
            {nextSteps.map((s) => (
              <Card key={s.board} href={to(s.board)}><strong>{s.title}</strong><Text as="span" variant="small" tone="secondary">{s.body}</Text></Card>
            ))}
          </Grid>
          <Text variant="small" tone="secondary">Prototype states: <Link href={to('registerFailed')}>registration fails</Link></Text>
        </>
      )}
    </BuilderStep>
  );
}
