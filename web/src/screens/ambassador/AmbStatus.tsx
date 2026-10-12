/*
 * Data contract: Amb-5a-Verifying, Amb-5b-Paid, Amb-5c-VerifyFailed, Amb-5d-BudgetReached, M-5-Status (issue #53; canvas
 * https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards of the same names). Backend map row "Amb-5a, 5b, 5c, 5d, M-5"
 * (.agentic/what/context/backend_map.md §4): Realtime on `submissions`, GET /api/me/earnings, PUT /api/me/payout-wallet;
 * tables submissions, payouts, profiles, wallets. Shape: PostStatusData.
 *
 * | Field                    | Source                                                                    | Empty when                       |
 * |--------------------------|---------------------------------------------------------------------------|----------------------------------|
 * | campaign, piece, route,  | the flow's choices (session.ts): campaign joined, piece written, route     | defaults: the board's fixture    |
 * |   submittedUrl           | used and link sent; later from the submissions row                        |                                  |
 * | outcome, times           | submissions status, published_at, verified_at, approved_at; payouts paid_at | later steps: "to do", no time  |
 * | title, context, steps    | built from the fields above (copy.ts), never a fixed string               | never                            |
 * | paid (receiptLink,       | payouts tx signature → receipt link (bracketed until wired);              | outcome is not paid              |
 * |   postLink, balance)     | submissions platform_url; GET /api/me/earnings balance                    |                                  |
 * | formats → progress, next | the campaign's pieces (memberships); done = marked done or just paid      | all done: no next-piece button   |
 * | failure (reasons,        | verify_submission result: text difference, author mismatch; slot hold     | outcome is not failed            |
 * |   held, recoveries)      | until the campaign deadline                                               |                                  |
 * | budget (cap, caption)    | campaigns cap and payouts sum                                             | outcome is not budget            |
 *
 * States: loading (Amb-5a verifying), success (Amb-5b paid; M-5), error (Amb-5c verification failed; Amb-5d budget reached;
 * M-5 shows the failed check). Interactions: receipt sheet (note n-m5), See public check, Write another, recovery actions,
 * opt in to be paid if the brand tops up, prototype outcome links. Mobile timeline is vertical (note n-m5).
 */
import { Button, Stack } from '../../ui/primitives';
import { KeyValueList } from '../../ui/composites/KeyValueList';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { AmbShell } from '../../ui/domain/AmbShell';
import { AmbSheet } from '../../ui/domain/AmbSheet';
import { AmbStatusTimeline } from '../../ui/domain/AmbStatusTimeline';
import { useDisclosure } from '../../ui/hooks/useDisclosure';
import { BudgetView } from './parts/BudgetView';
import { FailedView } from './parts/FailedView';
import { PageTitle } from './parts/PageTitle';
import { PaidView } from './parts/PaidView';
import { VerifyingView } from './parts/VerifyingView';
import type { StatusViewProps } from './parts/statusView';
import { receiptRows, statusContext, statusSteps, statusTitle } from './copy';
import { useAmbassadorFlow } from './useAmbassadorFlow';
import type { Device, PostOutcome, PostStatusData } from './types';

export interface AmbStatusProps {
  data: PostStatusData;
  device: Device;
  state?: ScreenState;
}

const views: Record<PostOutcome, (p: StatusViewProps) => ReturnType<typeof PaidView>> = {
  verifying: VerifyingView,
  paid: PaidView,
  failed: FailedView,
  budget: BudgetView,
};

export function AmbStatus({ data: fixture, device }: AmbStatusProps) {
  const flow = useAmbassadorFlow(device);
  const { campaign = fixture.campaign, piece = fixture.piece, route = fixture.route, submittedUrl = fixture.submittedUrl } = flow.session;
  const data: PostStatusData = { ...fixture, campaign, piece, route, submittedUrl };
  const receipt = useDisclosure();
  const mobile = device === 'mobile';
  const View = views[data.outcome];
  // Mobile puts the receipt on the Paid step (canvas M-5); desktop has it in the payment table (Amb-5b).
  const built = statusSteps(data);
  const steps = built.map((s, i) =>
    mobile && data.paid && i === built.length - 1
      ? { ...s, action: <Button variant="secondary" onClick={receipt.show} aria-haspopup="dialog">Receipt</Button> }
      : s,
  );

  return (
    <AmbShell {...flow.shell} account={data.account} active={data.outcome === 'paid' ? 'posts' : undefined} tabs>
      <Stack gap={6}>
        <PageTitle title={statusTitle(data)} context={statusContext(data)} />
        <AmbStatusTimeline steps={steps} orientation={mobile ? 'vertical' : 'horizontal'} />
        <View data={data} flow={flow} onReceipt={receipt.show} />
      </Stack>
      {data.paid && (
        <AmbSheet open={receipt.open} onClose={receipt.hide} title="Receipt">
          <KeyValueList label="Receipt" items={receiptRows(data)} />
        </AmbSheet>
      )}
    </AmbShell>
  );
}
