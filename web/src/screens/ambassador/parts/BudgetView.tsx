import { useState } from 'react';
import { Badge, Button, Stack, Text } from '../../../ui/primitives';
import { StatePanel } from '../../../ui/composites/StatePanel';
import { BudgetBar } from '../../../ui/domain/BudgetBar';
import { budgetBody, budgetCaption, budgetTitle, optInLabels } from '../copy';
import type { StatusViewProps } from './statusView';

/**
 * Amb-5d error (canvas note n-a5d): the post is still brand-approved (provenance) but unpaid; opt in to be paid if the
 * brand tops up. INTEGRATION: the opt-in is a PATCH on the submission (not in the backend map yet; the note leaves it open).
 */
export function BudgetView({ data, flow }: StatusViewProps) {
  const [optedIn, setOptedIn] = useState(false);
  const { budget } = data;
  if (!budget) return null;
  const labels = optInLabels(data.campaign.brand);
  return (
    <StatePanel
      kind="error"
      title={budgetTitle(data, `${budget.budget.cap} ${budget.budget.unit}`)}
      body={
        <Stack gap={3}>
          <span><Badge tone="solid">{budget.chip}</Badge></span>
          <BudgetBar budget={budget.budget} caption={budgetCaption(budget.budget)} />
          <Text>{budgetBody(data)}</Text>
        </Stack>
      }
      actions={
        <>
          <Button aria-pressed={optedIn} onClick={() => setOptedIn((v) => !v)}>{optedIn ? labels.on : labels.off}</Button>
          <Button href={flow.paths.campaigns} variant="secondary">See other campaigns</Button>
        </>
      }
    />
  );
}
