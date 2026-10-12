/*
 * Data contract: J1-Read, "Read: facts with quotes (AHA 1)" (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * board J1-Read, note n-j1-read; issue #48). Shape: ReadData in ./types. Backend map: .agentic/what/context/backend_map.md
 * §4, rows "Onboard-3-Sources" and "Onboard-3b-Profiling, Ingest-Error".
 *
 * | Field     | Source                                                                                                  | Empty when |
 * |-----------|---------------------------------------------------------------------------------------------------------|------------|
 * | site      | The address typed on Main (useJourneyFlow), stored as `brands.website` by POST /api/brands; the fixture's when opened directly | never |
 * | sources[] | `sources` rows: POST /api/brands/:id/sources {url} adds one (web/worker/api.ts); status from the ingest job (Realtime on `jobs`, `sources`) | [] before the first read |
 * | facts[]   | `evidence` rows with their quote and page, via GET /api/brands/:id (brandState). A fact is kept only if its quote is on the page | [] while reading, or for an empty site |
 * | coverage  | GET /api/brands/:id/coverage (backend map row "Coverage-Map"; rules only)                                 | all six "Needs you" |
 *
 * States (note n-j1-read): success = facts streaming in, one source blocked (as drawn); loading = per-source "Reading…";
 * error = the site is blocked, the panel offers paste, upload or skip; empty = an empty site goes straight to the
 * question-led fallback (BB-1-Basics, as Main's "No website?" link). Continue opens once there is a fact to keep.
 * The person can continue while reading goes on.
 */
import type { ReactNode } from 'react';
import { Button, Stack, Text } from '../../ui/primitives';
import { Card } from '../../ui/composites/Card';
import { EmptyState } from '../../ui/composites/EmptyState';
import { SampleFlag } from '../../ui/composites/SampleFlag';
import { StatePanel } from '../../ui/composites/StatePanel';
import { JourneyAha } from '../../ui/domain/JourneyAha';
import { JourneyFactCard } from '../../ui/domain/JourneyFactCard';
import { ProgressBar } from '../../ui/composites/ProgressBar';
import { StatusList } from '../../ui/composites/StatusList';
import { Columns } from '../../ui/layouts/Columns';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { JourneyNextButton } from './JourneyNextButton';
import { JourneyStepFrame } from './JourneyStepFrame';
import { ReadAddMore } from './ReadAddMore';
import { ReadBlockedSource } from './ReadBlockedSource';
import { useJourneyHref } from './paths';
import { useJourneyFlow } from './useJourneyFlow';
import { useJourneySources } from './useJourneySources';
import type { ReadData } from './types';

export interface ReadProps {
  data: ReadData;
  state?: ScreenState;
}

export function J1Read({ data, state = 'success' }: ReadProps) {
  const to = useJourneyHref();
  const { selections } = useJourneyFlow('read');
  // The site typed on Main, else the fixture's; it names the page and the home source.
  const site = selections.site || data.site;
  const src = useJourneySources(data.sources.map((s) => (s.id === 'home' ? { ...s, label: site } : s)));
  const { blocked } = src;
  const c = data.coverage;
  // Shown in place of the facts when there are none yet, per state.
  const noFacts: Record<ScreenState, ReactNode> = {
    success: null,
    loading: <StatePanel kind="loading" title={`Reading ${site}`} body="Facts appear here as each page is read, each with the line it came from." />,
    error: <StatePanel kind="error" title={`We couldn't read ${site}`} body="Paste its text or upload a file on the left, or skip to a few questions." actions={<Button variant="secondary" href={to('basics')}>Start with a few questions</Button>} />,
    empty: <EmptyState title="Nothing to read on this site yet" body="We'll ask a few short questions instead." actions={<Button href={to('basics')}>Start with a few questions</Button>} />,
  };
  return (
    <JourneyStepFrame
      step="read"
      title={`Reading ${site}`}
      intro="We keep a fact only if its line is on the page. Start confirming whenever you like; we keep reading."
      footer={
        <>
          <ProgressBar grow showLabel label={`${c.found} of 6 kit sections found · ${c.partly} partly · ${c.needsYou} need you`} segments={[{ value: c.percent, label: 'Covered' }]} />
          <JourneyNextButton href={to('save')} ready={data.facts.length > 0} hint="Nothing to keep yet: facts appear as each page is read.">Keep these and continue</JourneyNextButton>
        </>
      }
    >
      <Columns
        stackBelow="md"
        start={
          <Stack gap={3}>
            <StatusList label="Sources" title surface="card" rows={src.rows} />
            {blocked && <ReadBlockedSource key={blocked.id} source={blocked} onSupply={(how) => src.supply(blocked.id, how)} onSkip={() => src.skip(blocked.id)} />}
            <ReadAddMore onAdd={src.add} />
          </Stack>
        }
      >
          <Stack as="section" gap={3} aria-live="polite" aria-label="Facts found">
            {data.facts.length > 0 && <JourneyAha n={1}>It already knows us, and shows exactly where it read it.</JourneyAha>}
            {data.facts.map((f) => <JourneyFactCard key={f.id} fact={f} />)}
            {data.facts.length === 0 && noFacts[state]}
            {src.reading && data.facts.length > 0 && (
              <Card variant="subtle" as="div">
                <Text variant="small" tone="secondary">Reading {src.reading.label}… <SampleFlag /> statuses</Text>
              </Card>
            )}
          </Stack>
      </Columns>
    </JourneyStepFrame>
  );
}
