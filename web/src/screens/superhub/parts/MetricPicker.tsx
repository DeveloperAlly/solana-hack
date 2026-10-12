import { useId } from 'react';
import { Badge } from '../../../ui/primitives/Badge';
import { Field, Stack, Text } from '../../../ui/primitives';
import { DataTable } from '../../../ui/composites/DataTable';
import type { MeasureStep } from '../hooks/useMeasureStep';
import type { CampaignMetric } from '../types';

export interface MetricPickerProps {
  metrics: CampaignMetric[];
  step: MeasureStep;
}

/**
 * D27 MetricPicker (n-c2 1–2): one main goal (radio) and up to three supporting numbers (checkboxes), a target for
 * each measurable metric, and where each number comes from. Numbers a platform does not share have no target input.
 */
export function MetricPicker({ metrics, step: flow }: MetricPickerProps) {
  const name = useId();
  return (
    <Stack gap={2}>
      <DataTable
        caption="Success metrics"
        hideCaption
        rows={metrics}
        rowKey={(m) => m.id}
        columns={[
          {
            key: 'use',
            header: 'Use',
            cell: (m) => (
              <Stack as="span" direction="row" gap={2} align="center">
                <input type="radio" name={name} checked={m.id === flow.mainMetric} disabled={!m.measurable} aria-label={`Main goal: ${m.metric}`} onChange={() => flow.setMainMetric(m.id)} />
                {m.id === flow.mainMetric ? <Badge>Main</Badge> : <input type="checkbox" aria-label={`Use ${m.metric}`} checked={flow.supporting.includes(m.id)} onChange={() => flow.toggleSupporting(m.id)} />}
              </Stack>
            ),
          },
          { key: 'metric', header: 'Metric', rowHeader: true },
          {
            key: 'target',
            header: 'Target',
            cell: (m) => (m.measurable
              ? <Field label={`Target for ${m.metric}`} hideLabel value={flow.targetOf(m.id)} placeholder={m.target} onChange={(e) => flow.setTarget(m.id, e.target.value)} />
              : <Text as="span" variant="small" tone="secondary">not available</Text>),
          },
          { key: 'source', header: 'Measured from', cell: (m) => <Text as="span" variant="small">{m.source}</Text> },
        ]}
      />
      {flow.limitError && <Text variant="small" tone="danger" role="alert">{flow.limitError}</Text>}
    </Stack>
  );
}
