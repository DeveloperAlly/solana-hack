/*
 * Data contract: Verify-Home (canvas v24 page "4 · Verify anywhere", board Verify-Home, Verify's "Your proof" tab;
 * ADR-012 decision 5). Shape: VerifyHomeData in ./types.ts.
 *
 * | Field         | Source                                                                                           |
 * |---------------|--------------------------------------------------------------------------------------------------|
 * | kpis          | registrations (built: kit and post rows, Registrar on devnet); checks by others and badge visits |
 * |               | (verify lookups, badge referrals): not built                                                      |
 * | registered[]  | GET /api/ledger?brand= (built): kit versions, posts, ambassador posts; approver from posts       |
 * | noMatch[]     | verify lookups with no match for this brand (an impersonation signal, owner only): not built     |
 *
 * Registration (a hash and ids, signed by the Registrar) is what is on Solana; approval is recorded in JamJam.
 * States (canvas Verify-Home note): success, empty (nothing registered yet: teaches "approve a post"), loading, error.
 */
import { useState } from 'react';
import { Button, Grid, Heading, Link, Select, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { DataTable } from '../../ui/composites/DataTable';
import { List, ListRow } from '../../ui/composites/ListRow';
import { StatTile } from '../../ui/composites/StatTile';
import { StateView } from '../../ui/composites/StateView';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { PageHeader } from '../../ui/layouts/PageHeader';
import { LoopPage } from './LoopPage';
import { useLoopLinks } from './paths';
import type { RegisteredRow, VerifyHomeData } from './types';

const kinds = [
  { value: 'all', label: 'Everything' },
  { value: 'kit', label: 'Kit versions' },
  { value: 'post', label: 'Your posts' },
  { value: 'ambassador', label: 'Ambassador posts' },
];

export function VerifyHome({ data, state = 'success' }: { data: VerifyHomeData; state?: ScreenState }) {
  const { links, to } = useLoopLinks();
  const [kind, setKind] = useState('all');
  const rows = data.registered.filter((r) => kind === 'all' || r.kind === kind);
  return (
    <LoopPage tag="COMING SOON" stage="verify" tab="proof" brandName={data.brandName}>
      <PageHeader
        title="Your proof"
        intro={`What ${data.brandName} has registered on Solana, and who has checked it.`}
        actions={<><Button variant="secondary" href={links.ledger}>Public ledger</Button><Button href={links.badge}>Get the badge</Button></>}
      />
      <StateView
        state={state}
        empty={{ title: 'Nothing registered yet', body: 'Approve a post and it is registered on Solana: a hash and ids, never the text. Then anyone can check it on Verify.', actions: <Button href={links.contentDashboard}>Approve a post</Button> }}
        loading={{ title: 'Loading your proof' }}
        error={{ title: "Couldn't load your proof", body: 'Your registrations are safe on Solana; this page could not read them.', actions: <Button variant="secondary" href={links.verifyHome}>Try again</Button> }}
      >
        <Grid min="sm" gap={4}>{data.kpis.map((k) => <StatTile key={k.label} {...k} sample />)}</Grid>
        <Card labelledBy="reg-h" header={<><Heading level={2} size="lg" id="reg-h">Registered</Heading><Select label="Show" layout="inline" options={kinds} value={kind} onValueChange={setKind} /></>}>
          <DataTable<RegisteredRow>
            caption="Registered records"
            hideCaption
            rows={rows}
            rowKey={(r) => r.id}
            empty={<Text variant="small" tone="secondary">Nothing of this kind registered yet.</Text>}
            columns={[
              { key: 'what', header: 'What', rowHeader: true },
              { key: 'when', header: 'When' },
              { key: 'approver', header: 'Approved by' },
              { key: 'record', header: 'Record', cell: (r) => <Link href={to(r.record)}>Check</Link> },
            ]}
          />
        </Card>
        <Card labelledBy="nm-h" header={<Heading level={2} size="lg" id="nm-h">Checks that found no match</Heading>}>
          <Text variant="small">{data.noMatch.length} {data.noMatch.length === 1 ? 'person' : 'people'} pasted text that claimed to be from {data.brandName} and wasn't registered. Each could be an impersonation. Only you see this.</Text>
          <List label="Checks that found no match">
            {data.noMatch.map((n) => <ListRow key={n.id} title={n.text} detail={n.when} actions={<Button variant="secondary" href={links.verifyNoMatch}>See the check</Button>} />)}
          </List>
        </Card>
      </StateView>
    </LoopPage>
  );
}
