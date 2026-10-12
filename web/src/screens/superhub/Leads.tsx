/*
 * Data contract: Leads (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Leads, note n-le).
 * Shape: LeadsData in ./types.ts. Backend map §4 Grow, row "Leads (experimental)": `POST …/leads/search`,
 * `GET …/leads.csv` (table leads; Exa /search, company and people categories, public only).
 *
 * | Field         | Source                                                                                          |
 * |---------------|-------------------------------------------------------------------------------------------------|
 * | query         | Pre-filled from brand pack audiences (n-le 1); signals and sources from the GamersLab lead      |
 * |               | finder, bracketed until confirmed (n-le 2)                                                      |
 * | total         | Count returned by the search                                                                    |
 * | leads[]       | leads: organisation, fit, the public signal behind it, status (new, draft in queue)             |
 *
 * Empty: no matches for the description ("No leads found"). States drawn: success only.
 */
import { Badge } from '../../ui/primitives/Badge';
import { Button, Field, Grid, Heading, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { DataTable } from '../../ui/composites/DataTable';
import { HubPage } from './parts/HubPage';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import { StatusNote } from './parts/StatusNote';
import { useLeads } from './hooks/useLeads';
import { LeadAction } from './parts/LeadAction';
import { useHubLinks } from './paths';
import type { LeadsData } from './types';

const fields = [['who', 'Who'], ['size', 'Size and region'], ['signals', 'Signals'], ['sources', 'Sources']] as const;

export function Leads({ data }: { data: LeadsData }) {
  const links = useHubLinks();
  const leads = useLeads(data);
  return (
    <HubPage artboard="Leads">
      <Text variant="small" tone="secondary">{data.banner}</Text>
      <PageHeader badges={<ComingSoonFlag tag="EXPERIMENTAL" />} title="Find your customers" intro={data.intro} />
      <Card as="div">
        <Grid min="sm" gap={3}>
          {fields.map(([k, label]) => (
            <Field key={k} label={label} value={leads.query[k]} error={k === 'who' ? leads.error : null} onChange={(e) => leads.setField(k, e.target.value)} />
          ))}
        </Grid>
        <Stack direction="row" gap={3} align="center" wrap>
          <Button onClick={leads.find}>Find leads</Button>
          <Text as="span" variant="small" tone="secondary">{data.prefillNote}</Text>
        </Stack>
        <StatusNote>{leads.searched && `Searching public sources for: ${leads.searched}. Results below are sample data.`}</StatusNote>
      </Card>
      <Card labelledBy="leads-results" header={<><Heading level={2} size="lg" id="leads-results">{data.total} leads</Heading><Button variant="secondary" onClick={leads.exportCsv}>Export CSV</Button></>}>
        <DataTable
          caption="Leads"
          hideCaption
          rows={leads.rows}
          rowKey={(l) => l.id}
          empty="No leads found for this description."
          columns={[
            { key: 'name', header: 'Lead', rowHeader: true },
            { key: 'fit', header: 'Fit', sort: (a, b) => a.fit.localeCompare(b.fit) },
            { key: 'why', header: 'Why' },
            { key: 'status', header: 'Status', cell: (l) => <Badge>{leads.statusLabel[l.status]}</Badge> },
          ]}
          actions={(l) => <LeadAction lead={l} onDraft={leads.draftOutreach} contentHref={links.content} />}
        />
        <Text variant="small" tone="secondary">{data.outreachNote}</Text>
      </Card>
    </HubPage>
  );
}
