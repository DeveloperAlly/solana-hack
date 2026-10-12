/*
 * Data contract: Amb-2-Detail, M-2-Detail (issue #53; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards
 * Amb-2-Detail and M-2-Detail). Backend map row "Amb-2, M-2" (.agentic/what/context/backend_map.md §4):
 * POST /api/campaigns/:id/join, POST /api/wallets/link; tables memberships, wallets, wallet_challenges. Shape: CampaignDetailData.
 *
 * | Field                               | Source                                                          | Empty when                 |
 * |-------------------------------------|-----------------------------------------------------------------|----------------------------|
 * | account                             | Supabase session (ADR-006: email sign-in, no wallet)            | signed out: "Sign in"      |
 * | campaign (title, time left, slots)  | GET /api/campaigns/open row (campaigns)                         | never on this screen       |
 * | brandVerified                       | brands.domain_verified ("adna.network verified")                | unverified brand: name only|
 * | brief, formats[], rules[]           | campaigns brief, payout formats (no X format: ADR-002), rules   | never: a campaign has them |
 * | budget (spent, committed, cap)      | campaigns cap; payouts spent; submissions awaiting approval     | spent 0: the empty bar     |
 * | howPaid, joinEmail                  | copy; the email field of the inline sign-in (canvas note n-a2)  | joinEmail is a placeholder |
 *
 * States: success. Interactions: inline sign-in to join (note n-a2), a state machine in useJoin: email → code (only after a code
 * was sent) → joined → Generate; on mobile it sits in the sticky bottom bar behind the Join button and the brief collapses after
 * 4 lines (note n-m2); the budget bar warns under 20% (note n-a2); back to campaigns.
 */
import { Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { DataTable } from '../../ui/composites/DataTable';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { Columns } from '../../ui/layouts/Columns';
import { BudgetBar } from '../../ui/domain/BudgetBar';
import { CollapsibleText } from '../../ui/composites/CollapsibleText';
import { InfoCard } from './parts/InfoCard';
import { JoinPanel } from './parts/JoinPanel';
import { PageTitle } from './parts/PageTitle';
import { AmbassadorFrame } from './parts/AmbassadorFrame';
import { useAmbassadorFlow } from './useAmbassadorFlow';
import { useJoin } from './useJoin';
import type { CampaignDetailData, Device, PieceFormat } from './types';

export interface AmbDetailProps {
  data: CampaignDetailData;
  device: Device;
  state?: ScreenState;
}

const formatColumns = [
  { key: 'name', header: 'Format', rowHeader: true },
  { key: 'where', header: 'Where' },
  { key: 'payout', header: 'Payout', align: 'end' as const },
];

export function AmbDetail({ data, device }: AmbDetailProps) {
  const flow = useAmbassadorFlow(device);
  const desktop = device === 'desktop';
  const { campaign } = data;
  const join = useJoin({
    startOpen: desktop,
    signedIn: data.account !== null,
    onJoined: () => {
      flow.remember({ campaign: { title: campaign.title, brand: campaign.brand } });
      flow.go('generate');
    },
  });
  const joinPanel = <JoinPanel join={join} emailPlaceholder={data.joinEmail} signedInAs={data.account?.name} />;

  const main = (
    <Stack gap={5}>
      <InfoCard title="Brief"><CollapsibleText text={data.brief} collapsible={!desktop} /></InfoCard>
      <InfoCard title="What you can make">
        <DataTable<PieceFormat> caption="Formats and payouts" hideCaption columns={formatColumns} rows={data.formats} rowKey={(r) => r.id} />
        <Text variant="small" tone="secondary">{data.formatsNote}</Text>
      </InfoCard>
      <InfoCard title="Rules">
        <Stack as="ul" gap={1}>{data.rules.map((r) => <li key={r}><Text>{r}</Text></li>)}</Stack>
      </InfoCard>
    </Stack>
  );
  const budget = <InfoCard title="Budget"><BudgetBar budget={data.budget} /></InfoCard>;

  return (
    <AmbassadorFrame flow={flow} account={data.account} active="campaigns" back={{ href: flow.paths.campaigns, label: 'Back to campaigns' }} title={campaign.title} footer={desktop ? undefined : joinPanel}>
      <Stack gap={6}>
        <PageTitle
          title={campaign.title}
          context={desktop ? data.brandVerified : undefined}
          back={desktop ? { href: flow.paths.campaigns, label: 'All campaigns' } : undefined}
          chips={[campaign.timeLeft, campaign.slots, desktop ? data.reviewNote : undefined].filter((c): c is string => Boolean(c))}
        />
        {desktop ? (
          <Columns
            end={
              <>
                {budget}
                <InfoCard title="How you get paid"><Text variant="small">{data.howPaid}</Text></InfoCard>
                <Card variant="subtle" as="div">{joinPanel}</Card>
              </>
            }
          >
            {main}
          </Columns>
        ) : (
          <Stack gap={5}>{main}{budget}</Stack>
        )}
      </Stack>
    </AmbassadorFrame>
  );
}
