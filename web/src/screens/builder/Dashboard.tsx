/*
 * Data contract: Dashboard and its empty variant Dashboard-Empty (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * boards Dashboard and Dashboard-Empty, notes n-dash, n-dashe; issue #50). Backend map §4, row "Dashboard (and its empty
 * state)" (GET …/ambassadors; POST /api/submissions/:id/approve, /reject, /pay). Shape: DashboardData in ./types.
 *
 * | Field         | Source                                                                        | Empty                         |
 * |---------------|-------------------------------------------------------------------------------|-------------------------------|
 * | byBrand       | One DashboardData per brand; the switcher's choice (flow) selects it          | never                         |
 * | title         | The active brand's name (brands)                                              | never                         |
 * | meta          | brands.domain_verified, kit_versions.version, the open campaign and its cap   | "<domain> verified · Kit v1"  |
 * | kpis          | GET …/ambassadors: approved posts, spend vs cap, paid, awaiting approval      | zeros                         |
 * | pending       | submissions awaiting approval, with checks (on-brand score, platform verify)  | "Nothing to review"           |
 * | campaigns     | campaigns with spent / committed / cap (payouts)                              | "No campaigns yet"            |
 * | recent        | payouts with receipts (registrations)                                         | "No ambassador posts yet"     |
 * | kit           | kit_versions: summary, approved date and use count                            | summary always present        |
 * | publicPageUrl | The brand's public page                                                       | n/a                           |
 *
 * States: success on Dashboard; empty on Dashboard-Empty (each module says what will appear and offers one action).
 * Approve and Pay are separate; only the owner pays; Reject asks for a reason (note n-dash.2).
 */
import { Button, Grid, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { EmptyState } from '../../ui/composites/EmptyState';
import { StatTile } from '../../ui/composites/StatTile';
import { BuilderHubPage } from './BuilderHubPage';
import { BuilderSection } from './BuilderSection';
import { DashboardApproval } from './DashboardApproval';
import { DashboardCampaigns } from './DashboardCampaigns';
import { DashboardPayouts } from './DashboardPayouts';
import { growSubnav, useBoardHref } from './paths';
import type { DashboardScreenData } from './types';
import { useHubBrand } from './useBuilderFlow';

export function Dashboard({ data: screen }: { data: DashboardScreenData }) {
  const to = useBoardHref();
  const [brandId, selectBrand] = useHubBrand();
  const data = screen.byBrand[brandId] ?? screen.byBrand[screen.defaultBrandId];
  return (
    <BuilderHubPage
      brandId={brandId}
      onSelectBrand={selectBrand}
      subnav={{ label: 'Grow', items: growSubnav, current: 'ambassadors' }}
      title={data.title}
      tag="STRETCH"
      intro={data.meta}
      action={data.campaigns.length > 0 && <Button href={to('campaignBuilder')}>New campaign</Button>}
    >
      <Grid min="sm" gap={4}>
        {data.kpis.map((k) => <StatTile key={`${k.label}:${k.value}`} {...k} />)}
      </Grid>
      {data.pending.length ? (
        <Card as="div">
          <BuilderSection title="Pending approvals">
            <Stack as="ul" gap={0}>
              {data.pending.map((p) => <DashboardApproval key={`${brandId}:${p.id}`} item={{ ...p, link: { label: p.link.label, href: to(p.link.board) } }} />)}
            </Stack>
          </BuilderSection>
        </Card>
      ) : (
        <EmptyState title="Nothing to review" body="Ambassador posts that need your approval will appear here." />
      )}
      <DashboardCampaigns campaigns={data.campaigns} />
      <Grid min="md" gap={5}>
        <DashboardPayouts rows={data.recent} brandName={data.title} publicPageUrl={data.publicPageUrl} />
        <Card as="aside" variant="subtle">
          <BuilderSection title="Kit v1">
            <Text variant="small">{data.kit.summary}</Text>
            {data.kit.usage && <Text variant="small" tone="secondary">{data.kit.usage}</Text>}
            <Stack direction="row"><Button href={to('brandBuild')} variant="secondary">Edit kit (creates v2)</Button></Stack>
          </BuilderSection>
        </Card>
      </Grid>
    </BuilderHubPage>
  );
}
