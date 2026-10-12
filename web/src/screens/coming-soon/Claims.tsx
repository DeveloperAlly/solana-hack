/*
 * Data contract: Claims (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Claims; issue #51)
 * Backend map §4 row "Claims (screen missing)": GET/POST/PATCH …/claims, GET …/claims/suggest; tables claims, evidence,
 * registrations; a SAS attestation when a claim is approved and registered. Inventory D19 ClaimTable, D14. Shape: ClaimsData.
 *
 * | Field                | Source                                                   | Empty when                     |
 * |----------------------|----------------------------------------------------------|--------------------------------|
 * | claims[].text        | claims.text                                              | no claims yet                  |
 * | claims[].evidence    | evidence linked to the claim (D14)                       | "None yet" (pending)           |
 * | claims[].owner       | claims owner (a member)                                  | never                          |
 * | claims[].expires     | claims expiry                                            | pending: "–"                   |
 * | claims[].status      | approved / pending / expired                             | never                          |
 * | claims[].registered  | registrations row for the claim attestation              | not registered                 |
 *
 * States: success, empty ("No claims yet…", architecture §12.1 step 6), loading, error.
 */
import { useState, type ReactNode } from 'react';
import { Badge, Button, Text } from '../../ui/primitives';
import { DataTable } from '../../ui/composites/DataTable';
import { SoonPage } from './SoonPage';
import { InlineForm } from '../../ui/composites/InlineForm';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { tableState } from './tableState';
import { useSoonSession } from './useSoonSession';
import { ChipBadge } from './ChipBadge';
import { claimChips, filterOptionsFrom } from './status';
import { required } from './validate';
import type { Claim, ClaimStatus, ClaimsData } from './types';

const filterOptions = filterOptionsFrom(claimChips);

export function Claims({ data, state = 'success' }: { data: ClaimsData; state?: ScreenState }) {
  const [session, set] = useSoonSession();
  // Claim edits (here or from Media-Review "Add a source") are session state over the fixture rows.
  const rows = data.claims.map((c) => ({ ...c, ...session.claims?.[c.id] }));
  const [evidenceFor, setEvidenceFor] = useState<string | null>(null);
  const patch = (id: string, p: Partial<Claim>) => set({ claims: { ...session.claims, [id]: { ...session.claims?.[id], ...p } } });
  // INTEGRATION: PATCH …/claims/:id; Register -> the Registrar's SAS claim attestation (backend map "Claims").
  const actionFor: Record<ClaimStatus, (c: Claim) => ReactNode> = {
    approved: (c) => (c.registered ? <Badge tone="solid">Registered</Badge> : <Button variant="secondary" aria-label={`Register ${c.text}`} onClick={() => patch(c.id, { registered: true })}>Register</Button>),
    pending: (c) => <Button variant="secondary" aria-label={`Add evidence for ${c.text}`} onClick={() => setEvidenceFor(c.id)}>Add evidence</Button>,
    expired: (c) => <Button variant="secondary" aria-label={`Renew ${c.text}`} onClick={() => patch(c.id, { status: 'pending', expires: '–' })}>Renew</Button>,
  };
  const attach = (v: Record<string, string>) => {
    if (evidenceFor) patch(evidenceFor, { evidence: v.source, status: 'approved', expires: '[date]' });
    setEvidenceFor(null);
  };
  return (
    <SoonPage artboard="Claims" header={{ title: 'Claims', intro: 'Every factual claim your posts may make, with its evidence, an owner and an expiry.', definedIn: 'component inventory D19 ClaimTable, D14; screen map row Claims / Claims-Empty' }}>
      <DataTable<Claim>
        caption="Claims"
        hideCaption
        columns={[
          { key: 'text', header: 'Claim', rowHeader: true, sort: (a, b) => a.text.localeCompare(b.text) },
          { key: 'evidence', header: 'Evidence' },
          { key: 'owner', header: 'Owner' },
          { key: 'expires', header: 'Expires' },
          { key: 'status', header: 'Status', cell: (c) => <ChipBadge chip={claimChips[c.status]} />, sort: (a, b) => a.status.localeCompare(b.status) },
        ]}
        rows={rows}
        rowKey={(c) => c.id}
        state={tableState[state]}
        filter={{ label: 'Filter by status', options: filterOptions, match: (c, id) => c.status === id }}
        empty={<Text tone="secondary">No claims yet. Claims start empty until evidence is attached.</Text>}
        error={<Text tone="danger">Could not load claims. Drafts stay blocked from making claims until this loads.</Text>}
        actions={(c) => actionFor[c.status](c)}
      />
      {evidenceFor && (
        <InlineForm surface="card"
          label="Add evidence"
          fields={[{ name: 'source', label: 'Evidence', hint: 'A URL or a short description of the source that backs this claim.', validate: required('the evidence') }]}
          submitLabel="Attach and approve"
          onSubmit={attach}
          onCancel={() => setEvidenceFor(null)}
        />
      )}
      <Text variant="small" tone="secondary">Drafts may only make approved, unexpired claims. Expired or pending claims are blocked before you see a draft.</Text>
    </SoonPage>
  );
}
