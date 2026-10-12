/*
 * Data contract: Onboard-3b-Profiling and its error variant Ingest-Error (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * boards Onboard-3b-Profiling and Ingest-Error, notes n-ob3b, n-ingerr; issue #50). Backend map §4, row
 * "Onboard-3b-Profiling, Ingest-Error". Shape: ProfilingData in ./types.
 *
 * | Field    | Source                                                                                    | Empty                     |
 * |----------|-------------------------------------------------------------------------------------------|---------------------------|
 * | brand    | brands, profiles                                                                          | never                     |
 * | progress | jobs.progress over Realtime (IngestWorkflow, started by POST /api/brands/:id/ingest)       | 0                         |
 * | rows     | sources (status, error, facts found from evidence) and the job's later stages, over Realtime | never: the job lists its stages |
 *
 * States: loading (reading, one row at a time) on Onboard-3b; error (a source failed: Retry or Skip inline, others keep
 * going, upload instead) on Ingest-Error. The owner can carry on to intake step 2 while this runs (note n-ob3b.2).
 */
import { useState } from 'react';
import { Button, Link, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { BuilderFilePicker } from '../../ui/domain/BuilderFilePicker';
import { BuilderProgressBar } from '../../ui/domain/BuilderProgressBar';
import { BuilderSourceList, type SourceRow } from '../../ui/domain/BuilderSourceList';
import { BuilderStep } from './BuilderStep';
import { useBoardHref } from './paths';
import { useBuilderFlow } from './useBuilderFlow';
import type { ProfilingData } from './types';

export function Onboard3bProfiling({ data }: { data: ProfilingData }) {
  const failedAtStart = data.rows.some((r) => r.tone === 'failed');
  const flowKey = failedAtStart ? 'ingestError' : 'profiling';
  const { next } = useBuilderFlow(flowKey);
  const to = useBoardHref();
  const [rows, setRows] = useState(data.rows);
  const update = (id: string, patch: Partial<SourceRow>) => setRows((all) => all.map((r) => (r.id === id ? { ...r, ...patch, error: undefined } : r)));
  // INTEGRATION: POST /api/sources/:id/retry (backend map §4, row "Onboard-3b-Profiling, Ingest-Error").
  const retry = (r: SourceRow) => update(r.id, { status: 'Reading…', tone: 'active' });
  const failed = rows.find((r) => r.tone === 'failed');
  return (
    <BuilderStep flow={flowKey} brand={data.brand} tag="FALLBACK" title="Reading your sources" intro="You can carry on with the next question while this runs.">
      <Card as="div">
        {!failedAtStart && <BuilderProgressBar label="Reading progress" segments={[{ value: data.progress, label: 'Read' }]} />}
        <BuilderSourceList
          label="Sources being read"
          rows={rows}
          actions={(r) => r.tone === 'failed' && <><Button onClick={() => retry(r)}>Retry</Button><Button href={next ?? ''} variant="secondary">Skip</Button></>}
        />
        {failedAtStart && <Text variant="small" tone="secondary">Skipping only means we&apos;ll ask you about what that source would have covered. You can also upload the page as a PDF instead.</Text>}
        <Stack direction="row" gap={3} align="center" wrap>
          {failed && <BuilderFilePicker label="Upload it as a file" accept=".pdf,.md,.docx" onFiles={([name]) => update(failed.id, { name, status: 'Supplied by you', tone: 'done' })} />}
          <Button href={next ?? ''}>{failedAtStart ? 'Continue without it' : 'Continue to the next question'}</Button>
        </Stack>
      </Card>
      {!failedAtStart && <Text variant="small" tone="secondary">Prototype states: <Link href={to('ingestError')}>a source fails</Link></Text>}
    </BuilderStep>
  );
}
