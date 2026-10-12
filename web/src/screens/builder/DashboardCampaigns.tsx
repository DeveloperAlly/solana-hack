import { Button, Link, Text } from '../../ui/primitives';
import { DataTable } from '../../ui/composites/DataTable';
import { EmptyState } from '../../ui/composites/EmptyState';
import { BuilderProgressBar } from '../../ui/domain/BuilderProgressBar';
import { BuilderSection } from './BuilderSection';
import { otherPaths } from './paths';
import type { CampaignRow } from './types';

const pct = (part: number, cap: number) => (cap ? (part / cap) * 100 : 0);

/** Dashboard "Active campaigns" (canvas Dashboard, note n-dash.1): budget bar of spent / committed / remaining against the cap. */
export function DashboardCampaigns({ campaigns }: { campaigns: CampaignRow[] }) {
  if (!campaigns.length) {
    return (
      <EmptyState
        title="No campaigns yet"
        body="Campaigns pay community ambassadors in USDC for verified posts in your voice. You set a spending cap; nothing leaves your account until a post is approved."
        actions={<Button href={otherPaths.campaignBuilder}>Create a campaign</Button>}
      />
    );
  }
  return (
    <BuilderSection title="Active campaigns" action={<Link href={otherPaths.campaignBuilder}>+ New</Link>}>
      <DataTable
        caption="Campaign budgets and posts"
        hideCaption
        rows={campaigns}
        rowKey={(c) => c.id}
        columns={[
          { key: 'name', header: 'Campaign', rowHeader: true, cell: (c) => <><strong>{c.name}</strong><Text variant="small" tone="secondary">{c.channels}</Text></> },
          { key: 'ends', header: 'Ends' },
          {
            key: 'budget',
            header: 'Budget',
            cell: (c) => (
              <BuilderProgressBar
                label={`${c.name} budget`}
                segments={[{ value: pct(c.spent, c.cap), label: 'Spent' }, { value: pct(c.committed, c.cap), label: 'Committed', tone: 'muted' }]}
                caption={`${c.spent} spent · ${c.committed} committed · ${c.cap - c.spent - c.committed} left of ${c.cap} USDC`}
              />
            ),
          },
          { key: 'posts', header: 'Posts', cell: (c) => <>{c.paid}<Text variant="small" tone="secondary">{c.pending}</Text></> },
        ]}
        actions={(c) => <Button variant="secondary" href={otherPaths.campaignBuilder} aria-label={`Open ${c.name}`}>Open</Button>}
      />
    </BuilderSection>
  );
}
