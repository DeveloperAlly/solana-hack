import type { ReactNode } from 'react';
import { Badge } from '../primitives/Badge';
import { Heading } from '../primitives/Heading';
import { Text } from '../primitives/Text';
import { Card } from '../composites/Card';
import { DataTable } from '../composites/DataTable';
import { CopyButton } from '../composites/CopyButton';
import styles from './BuilderDnsRecord.module.css';

export interface DnsRecord {
  type: string;
  host: string;
  value: string;
}

export type DnsCheckStatus = 'waiting' | 'not-found' | 'verified';

/**
 * The words for a failed check, from the current domain, record and causes: the on-screen heading, and the subject and
 * body of the "send these steps to my developer" email. One source, so the three never disagree.
 */
export function dnsCheckCopy(domain: string, record: DnsRecord, causes: string[]): { heading: string; subject: string; body: string } {
  return {
    heading: `We couldn't find the record on ${domain}`,
    subject: `DNS record for ${domain}`,
    body: [`Please add this DNS record for ${domain}:`, `Type: ${record.type}`, `Host: ${record.host}`, `Value: ${record.value}`, '', 'If it was added already, check:', ...causes.map((c) => `- ${c}`)].join('\n'),
  };
}

export interface BuilderDnsRecordProps {
  record: DnsRecord;
  domain: string;
  status: DnsCheckStatus;
  /** Plain-language causes, shown when the record was not found. */
  causes?: string[];
  /** Check now / Check again, plus any other action. */
  actions: ReactNode;
}

/**
 * D37 DnsRecordCard: the TXT record to add (with Copy value), then the check status and its actions.
 * waiting (canvas board Onboard-2-Domain), not found with causes (Onboard-2b-DomainFailed; note n-ob2b), or verified.
 */
export function BuilderDnsRecord({ record, domain, status, causes = [], actions }: BuilderDnsRecordProps) {
  if (status === 'not-found') {
    return (
      <Card variant="emphasis" as="div">
        <div role="alert" className={styles.stack}>
          <div className={styles.head}><Badge tone="solid">Not found</Badge><Heading level={2} size="lg">{dnsCheckCopy(domain, record, causes).heading}</Heading></div>
          <ul className={styles.causes}>{causes.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
        <div className={styles.actions}>{actions}</div>
      </Card>
    );
  }
  return (
    <div className={styles.stack}>
      <Card as="div">
        <Heading level={2} size="lg">Add this {record.type} record at your DNS provider</Heading>
        <DataTable
          caption={`${record.type} record for ${domain}`}
          hideCaption
          columns={[
            { key: 'type', header: 'Type', rowHeader: true },
            { key: 'host', header: 'Host', cell: (r) => <Text as="span" variant="mono">{r.host}</Text> },
            { key: 'value', header: 'Value', cell: (r) => <Text as="span" variant="mono">{r.value}</Text> },
          ]}
          rows={[record]}
          rowKey={(r) => r.value}
          actions={(r) => <CopyButton value={r.value} label="Copy value" />}
        />
      </Card>
      <Card variant="subtle" as="div">
        <Badge tone={status === 'verified' ? 'success' : 'neutral'}>{status === 'verified' ? 'Status: verified' : 'Status: waiting for record'}</Badge>
        <Text tone="secondary">{status === 'verified' ? `${domain} is verified. Posts and claims can be checked against it.` : 'DNS changes can take a few minutes. We re-check while this page is open.'}</Text>
        <div className={styles.actions}>{actions}</div>
      </Card>
    </div>
  );
}
