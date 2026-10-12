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
 * States: success. Interactions: inline email sign-in validates and joins (desktop, note n-a2); mobile has a sticky Join bar and
 * the brief collapses after 4 lines (note n-m2); budget bar warns under 20% (note n-a2); back to campaigns.
 */
import { Button, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { DataTable } from '../../ui/composites/DataTable';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { AmbShell } from '../../ui/domain/AmbShell';
import { HubColumns } from '../../ui/domain/HubColumns';
import { AmbBudgetBar } from '../../ui/domain/AmbBudgetBar';
import { AmbCollapsibleText } from '../../ui/domain/AmbCollapsibleText';
import { AmbInlineForm } from '../../ui/domain/AmbInlineForm';
import { InfoCard } from './parts/InfoCard';
import { PageTitle } from './parts/PageTitle';
import { useAmbassadorFlow } from './useAmbassadorFlow';
import { validateEmail } from './validators';
import type { CampaignDetailData, Device, PayoutFormat } from './types';

export interface AmbDetailProps {
  data: CampaignDetailData;
  device: Device;
  state?: ScreenState;
}

const formatColumns = [
  { key: 'format', header: 'Format', rowHeader: true },
  { key: 'where', header: 'Where' },
  { key: 'payout', header: 'Payout', align: 'end' as const },
];

export function AmbDetail({ data, device }: AmbDetailProps) {
  const flow = useAmbassadorFlow(device);
  const desktop = device === 'desktop';
  const { campaign } = data;

  const main = (
    <Stack gap={5}>
      <InfoCard title="Brief"><AmbCollapsibleText text={data.brief} collapsible={!desktop} /></InfoCard>
      <InfoCard title="What you can make">
        <DataTable<PayoutFormat> caption="Formats and payouts" hideCaption columns={formatColumns} rows={data.formats} rowKey={(r) => r.id} />
        <Text variant="small" tone="secondary">{data.formatsNote}</Text>
      </InfoCard>
      <InfoCard title="Rules">
        <Stack as="ul" gap={1}>{data.rules.map((r) => <li key={r}><Text>{r}</Text></li>)}</Stack>
      </InfoCard>
    </Stack>
  );
  const budget = <InfoCard title="Budget"><AmbBudgetBar budget={data.budget} /></InfoCard>;
  // INTEGRATION: Supabase email code, then POST /api/campaigns/:id/join (memberships).
  const join = (
    <Card variant="subtle" as="div">
      <AmbInlineForm label="Sign in with email to join" type="email" placeholder={data.joinEmail} submitLabel="Join and start writing" validate={validateEmail} onSubmit={() => flow.go('generate')} />
    </Card>
  );
  const footer = (
    <>
      <Button href={flow.paths.generate} fullWidth>Join and start writing</Button>
      <Text variant="small" tone="secondary">Sign in with email on the next step</Text>
    </>
  );

  return (
    <AmbShell {...flow.shell} account={data.account} active="campaigns" back={{ href: flow.paths.campaigns, label: 'Back to campaigns' }} title={campaign.title} footer={desktop ? undefined : footer}>
      <Stack gap={6}>
        <PageTitle
          title={campaign.title}
          context={desktop ? data.brandVerified : undefined}
          back={desktop ? { href: flow.paths.campaigns, label: 'All campaigns' } : undefined}
          chips={[campaign.timeLeft, campaign.slots, desktop ? data.reviewNote : undefined].filter((c): c is string => Boolean(c))}
        />
        {desktop ? (
          <HubColumns
            end={
              <>
                {budget}
                <InfoCard title="How you get paid"><Text variant="small">{data.howPaid}</Text></InfoCard>
                {join}
              </>
            }
          >
            {main}
          </HubColumns>
        ) : (
          <Stack gap={5}>{main}{budget}</Stack>
        )}
      </Stack>
    </AmbShell>
  );
}
