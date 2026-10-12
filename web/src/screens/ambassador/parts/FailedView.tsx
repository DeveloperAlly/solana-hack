import { Badge, Grid, Stack, Text } from '../../../ui/primitives';
import { StatePanel } from '../../../ui/composites/StatePanel';
import { RecoveryCard } from './RecoveryCard';
import type { StatusViewProps } from './statusView';

/** Amb-5c error (canvas note n-a5c): which check failed, nothing paid, the slot held, and three ways to recover. */
export function FailedView({ data, flow }: StatusViewProps) {
  const { failure } = data;
  if (!failure) return null;
  return (
    <Stack gap={5}>
      <StatePanel
        kind="error"
        title={failure.title[data.piece.channel]}
        body={
          <Stack gap={3}>
            <span><Badge tone="solid">{failure.chip}</Badge></span>
            <Stack as="ul" gap={1}>{failure.reasons[data.piece.channel].map((r) => <li key={r}><Text>{r}</Text></li>)}</Stack>
            {data.submittedUrl && <Text variant="small">Link checked: {data.submittedUrl}</Text>}
            <Text variant="small" tone="secondary">{failure.held}</Text>
          </Stack>
        }
      />
      <Grid min="sm" gap={4}>
        {failure.recoveries.map((r) => <RecoveryCard key={r.id} recovery={r} href={r.to ? flow.paths[r.to] : undefined} />)}
      </Grid>
    </Stack>
  );
}
