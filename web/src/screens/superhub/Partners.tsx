/*
 * Data contract: Partners (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Partners, note
 * n-pa). Shape: PartnersData in ./types.ts. Backend map §4 Roadmap line "Partners: invites become memberships with the
 * partner role; email needs SMTP". Not built yet.
 *
 * | Field                  | Source                                                                                |
 * |------------------------|---------------------------------------------------------------------------------------|
 * | voiceOptions           | voices of the brand's kit (n-pa 1: seats with chosen voices)                          |
 * | approvalOptions        | Approval rule for partner drafts: they enter your approval queue (n-pa 2)             |
 * | seatsTotal             | memberships seat limit of the plan (row "Settings › Plan")                            |
 * | partners[]             | memberships with the partner role: voices, pieces this month (drafts), status         |
 *
 * Empty: no partners yet (the table says so). States drawn: success only.
 */
import { Badge } from '../../ui/primitives/Badge';
import { Button, Field, Grid, Heading, Select, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { DataTable } from '../../ui/composites/DataTable';
import { HubPage } from './parts/HubPage';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { StatusNote } from './parts/StatusNote';
import { usePartnerInvite } from './hooks/usePartnerInvite';
import type { PartnersData } from './types';

export function Partners({ data }: { data: PartnersData }) {
  const form = usePartnerInvite(data);
  return (
    <HubPage artboard="Partners">
      <PageHeader badges={<ComingSoonFlag tag="ROADMAP" />} title="Partners" intro={data.intro} />
      <Card labelledBy="partner-invite" header={<Heading level={2} size="lg" id="partner-invite">Invite a partner</Heading>}>
        <Grid min="sm" gap={3}>
          <Field label="Email" type="email" value={form.email} error={form.error} onChange={(e) => form.setEmail(e.target.value)} />
          <Select label="Voices they can use" options={[{ value: '', label: 'Choose voices', disabled: true }, ...data.voiceOptions]} value={form.voices} onChange={(e) => form.setVoices(e.target.value)} />
          <Select label="Approval" options={[{ value: '', label: 'Choose how drafts are approved', disabled: true }, ...data.approvalOptions]} value={form.approval} onChange={(e) => form.setApproval(e.target.value)} />
        </Grid>
        <Button onClick={form.invite} disabled={!form.ready}>Send invite (uses 1 of {data.seatsTotal} seats)</Button>
        {form.seatsFull && <Text variant="small" tone="secondary">All {data.seatsTotal} seats are in use.</Text>}
        <StatusNote>{form.sent && `Invite sent to ${form.sent}. ${form.approvalLabel}: their drafts come to your approval queue.`}</StatusNote>
      </Card>
      <Card labelledBy="partner-list" header={<Heading level={2} size="lg" id="partner-list">Current partners</Heading>}>
        <DataTable
          caption="Partner seats"
          hideCaption
          rows={form.partners}
          rowKey={(p) => p.id}
          empty="No partners yet."
          columns={[
            { key: 'name', header: 'Partner', rowHeader: true },
            { key: 'voices', header: 'Voices' },
            { key: 'pieces', header: 'Pieces this month' },
            { key: 'status', header: 'Status', cell: (p) => <Badge>{p.status}</Badge> },
          ]}
        />
      </Card>
      <Text variant="small" tone="secondary">{data.pricingNote}</Text>
    </HubPage>
  );
}
