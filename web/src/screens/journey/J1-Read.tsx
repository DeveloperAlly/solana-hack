/*
 * Data contract: J1-Read, "Read: facts with quotes (AHA 1)" (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * board J1-Read, note n-j1-read; issue #48). Shape: ReadData in ./types. Backend map: .agentic/what/context/backend_map.md
 * §4, rows "Onboard-3-Sources" and "Onboard-3b-Profiling, Ingest-Error".
 *
 * | Field     | Source                                                                                                  | Empty when |
 * |-----------|---------------------------------------------------------------------------------------------------------|------------|
 * | site      | The address from Main (client), stored as `brands.website` by POST /api/brands                          | never      |
 * | sources[] | `sources` rows: POST /api/brands/:id/sources {url} adds one (web/worker/api.ts); status from the ingest job (Realtime on `jobs`, `sources`) | [] before the first read |
 * | facts[]   | `evidence` rows with their quote and page, via GET /api/brands/:id (brandState). A fact is kept only if its quote is on the page | [] while reading, or for an empty site |
 * | coverage  | GET /api/brands/:id/coverage (backend map row "Coverage-Map"; rules only)                                 | all six "Needs you" |
 *
 * States (note n-j1-read): success = facts streaming in, one source blocked (as drawn); loading = per-source "Reading…";
 * error = the site is blocked, the panel offers paste, upload or skip; empty = an empty site goes straight to questions.
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
import { JourneyProgress } from '../../ui/domain/JourneyProgress';
import { JourneySplit } from '../../ui/domain/JourneySplit';
import { JourneyStatusList } from '../../ui/domain/JourneyStatusList';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { JourneyStepFrame } from './JourneyStepFrame';
import { ReadAddMore } from './ReadAddMore';
import { ReadBlockedSource } from './ReadBlockedSource';
import { journeyPaths } from './paths';
import { useJourneySources } from './useJourneySources';
import type { ReadData } from './types';

export interface ReadProps {
  data: ReadData;
  state?: ScreenState;
}

export function J1Read({ data, state = 'success' }: ReadProps) {
  const src = useJourneySources(data.sources);
  const { blocked } = src;
  const c = data.coverage;
  // Shown in place of the facts when there are none yet, per state.
  const noFacts: Record<ScreenState, ReactNode> = {
    success: null,
    loading: <StatePanel kind="loading" title={`Reading ${data.site}`} body="Facts appear here as each page is read, each with the line it came from." />,
    error: <StatePanel kind="error" title={`We couldn't read ${data.site}`} body="Paste its text or upload a file on the left, or skip to a few questions." actions={<Button variant="secondary" href={journeyPaths.gapsVoice}>Skip to questions</Button>} />,
    empty: <EmptyState title="Nothing to read on this site yet" body="We'll ask a few short questions instead." actions={<Button href={journeyPaths.gapsVoice}>Answer questions</Button>} />,
  };
  return (
    <JourneyStepFrame
      step="read"
      title={`Reading ${data.site}`}
      intro="We keep a fact only if its line is on the page. Start confirming whenever you like; we keep reading."
      footer={
        <>
          <JourneyProgress grow label={<><strong>{c.found} of 6 kit sections found</strong> · {c.partly} partly · {c.needsYou} need you</>} value={c.percent} />
          <Button href={journeyPaths.save}>Keep these and continue</Button>
        </>
      }
    >
      <JourneySplit
        ratio="rail"
        first={
          <>
            <JourneyStatusList title="Sources" rows={src.rows} />
            {blocked && <ReadBlockedSource key={blocked.id} source={blocked} onSupply={(how) => src.supply(blocked.id, how)} onSkip={() => src.skip(blocked.id)} />}
            <ReadAddMore onAdd={src.add} />
          </>
        }
        second={
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
        }
      />
    </JourneyStepFrame>
  );
}
