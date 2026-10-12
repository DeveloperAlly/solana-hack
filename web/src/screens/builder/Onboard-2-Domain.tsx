/*
 * Data contract: Onboard-2-Domain and its error variant Onboard-2b-DomainFailed (canvas
 * https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Onboard-2-Domain and Onboard-2b-DomainFailed, notes n-ob2, n-ob2b;
 * issue #50). Backend map §4, row "Onboard-2-Domain, Onboard-2b-DomainFailed". Shape: DomainData in ./types.
 *
 * | Field          | Source                                                                  | Empty                         |
 * |----------------|-------------------------------------------------------------------------|-------------------------------|
 * | brand          | brands (name, domain_verified), profiles (approver)                     | never: brand exists after sign-in |
 * | domain         | brands.domain; edited here                                              | blank field                   |
 * | record         | POST /api/brands/:id/domain/token -> TXT host and value                 | not shown until a domain is entered |
 * | check          | POST /api/brands/:id/domain/check -> waiting or not found               | waiting                       |
 * | causes         | Static plain-language causes for "not found" (note n-ob2b.1)            | n/a                           |
 * | developerSteps | Client: the record and causes as an email body                          | n/a                           |
 *
 * States: success (waiting for the record) on Onboard-2; error (record not found) on Onboard-2b. Skip continues
 * unverified to intake step 1 (note n-ob2.1). In the prototype "Check now" shows the failure and "Check again" succeeds.
 */
import { useState } from 'react';
import { Badge, Button, Field, Grid, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { BuilderDnsRecord } from '../../ui/domain/BuilderDnsRecord';
import { BuilderStep } from './BuilderStep';
import { BuilderStepFooter } from './BuilderStepFooter';
import { useBuilderFlow } from './useBuilderFlow';
import type { DomainData } from './types';

export function Onboard2Domain({ data }: { data: DomainData }) {
  const waiting = data.check === 'waiting';
  const flowKey = waiting ? 'domain' : 'domainFailed';
  const { back, next, skip } = useBuilderFlow(flowKey);
  const [name, setName] = useState(data.brand.name);
  const [domain, setDomain] = useState(data.domain);
  const mailto = `mailto:?subject=${encodeURIComponent(`DNS record for ${domain}`)}&body=${encodeURIComponent(data.developerSteps)}`;
  const actions = waiting
    ? <Button href={next ?? ''}>Check now</Button>
    : <><Button href={next ?? ''}>Check again</Button><Button href={mailto} variant="secondary">Email these steps to my developer</Button></>;
  return (
    <BuilderStep
      flow={flowKey}
      brand={data.brand}
      title="Prove you own your domain"
      flag={waiting && <Badge>Optional for now</Badge>}
      intro={waiting && 'A verified domain lets people check that posts and claims really come from you. You can skip this and verify later.'}
      footer={
        <BuilderStepFooter back={back} next={waiting ? { label: 'Continue (when verified)', blockedReason: 'Verify the domain first, or skip.' } : undefined}>
          <Button href={skip ?? ''} variant="secondary">Skip, continue unverified</Button>
        </BuilderStepFooter>
      }
    >
      {waiting && (
        <Grid min="sm" gap={4}>
          <Field label="Brand name" value={name} onChange={(e: { target: { value: string } }) => setName(e.target.value)} />
          <Field label="Domain" value={domain} onChange={(e: { target: { value: string } }) => setDomain(e.target.value)} />
        </Grid>
      )}
      {/* INTEGRATION: POST /api/brands/:id/domain/check (backend map §4); the Registrar writes an identity attestation on success. */}
      <BuilderDnsRecord record={data.record} domain={domain} status={data.check} causes={data.causes} actions={actions} />
      {waiting ? (
        <Card variant="subtle" as="div">
          <Text><strong>If you skip:</strong> your brand shows an <Badge>Unverified</Badge> flag. You can still build, approve and register your kit and posts. Until the domain is verified, Verify shows your brand name as self-declared, and ambassador payouts stay off.</Text>
        </Card>
      ) : (
        <Text variant="small" tone="secondary">Prototype: &ldquo;Check again&rdquo; simulates success and continues to intake step 1.</Text>
      )}
    </BuilderStep>
  );
}
