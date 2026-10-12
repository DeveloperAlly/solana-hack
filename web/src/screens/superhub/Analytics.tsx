/*
 * Data contract: Analytics and Analytics-Empty (issue #52; canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * boards Analytics and Analytics-Empty, notes n-an and n-ane). Shape: AnalyticsData in ./types.ts. Backend map §4
 * Roadmap line "Analytics and Analytics-Empty": a metrics cron reading X public_metrics for the brand's own posts and
 * YouTube videos.list statistics; LinkedIn metrics need Community Management API approval. Not built yet.
 *
 * | Field        | Source                                                                                          |
 * |--------------|-------------------------------------------------------------------------------------------------|
 * | ranges, byRange | metrics aggregated per range (the select switches them); reach only where platforms share  |
 * |              | it; cost per verified post from payouts                                                         |
 * | byVoice, byFormat | metrics grouped by drafts.voice and format ("what's working", n-an 1)                      |
 * | top, notWorking   | Best and worst posts and patterns (n-an 2)                                                 |
 * | suggestions  | Plan changes; they change the plan only when applied (n-an 3)                                   |
 * | connect      | connections per platform: Collecting for about 24 h; a disconnected source shows missing dates  |
 *
 * States: success (all sample data, n-an); empty = connect accounts; loading = collecting; error = a source
 * disconnected (n-ane). Analytics-Empty is the same screen in its empty, loading and error states.
 */
import { useState } from 'react';
import { Grid, Link, SelectField, Text } from '../../ui/primitives';
import { StatTile } from '../../ui/composites/StatTile';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { HubPage } from './parts/HubPage';
import { PageHeader } from './parts/PageHeader';
import { StateView } from './parts/StateView';
import { AnalyticsConnect } from './parts/AnalyticsConnect';
import { AnalyticsBreakdowns } from './parts/AnalyticsBreakdowns';
import { useHubLinks } from './paths';
import type { AnalyticsData } from './types';

export function Analytics({ data, state = 'success' }: { data: AnalyticsData; state?: ScreenState }) {
  const links = useHubLinks();
  const [range, setRange] = useState(data.ranges[0]?.value ?? '');
  const rangeLabel = data.ranges.find((r) => r.value === range)?.label ?? '';
  const numbers = data.byRange[range];
  const connect = <AnalyticsConnect connect={data.connect} state={state} />;
  return (
    <HubPage section="analytics">
      <PageHeader
        title="What's working"
        tag="ROADMAP"
        sample={state === 'success'}
        intro={state === 'success' ? `${rangeLabel} · all platforms` : undefined}
        actions={state === 'success' && <SelectField label="Range" options={data.ranges} value={range} onChange={(e) => setRange(e.target.value)} />}
      />
      <StateView
        state={state}
        views={{
          success: (
            <>
              <Grid min="sm" gap={4}>{numbers.kpis.map((k) => <StatTile key={k.label} label={k.label} value={k.value} sub={k.sub} sample />)}</Grid>
              <AnalyticsBreakdowns numbers={numbers} suggestions={data.suggestions} note={data.suggestionsNote} />
              <Text variant="small"><Link href={links.analyticsEmpty}>Connected accounts</Link></Text>
            </>
          ),
          empty: connect,
          loading: connect,
          error: connect,
        }}
      />
    </HubPage>
  );
}
