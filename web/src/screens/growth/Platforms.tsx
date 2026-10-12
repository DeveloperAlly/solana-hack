/*
 * Data contract: Platforms (canvas board "Platforms", v22; issue #82, sub-task "Platforms page").
 * Replaces the X/LinkedIn-only list in Settings-Connections. Backend map: .agentic/what/context/backend_map.md §4,
 * row "Settings › Connections" (connections table; X and LinkedIn OAuth), and §9 (external API facts). Shapes:
 * PlatformsData in ./types.ts; Platform in config/platforms.ts (M2 channel registry).
 *
 * | Field                    | Source                                                                   | Empty when                 |
 * |--------------------------|--------------------------------------------------------------------------|----------------------------|
 * | platforms[]              | M2 registry (config/platforms.ts); later GET /api/platforms (not built yet) | never: the catalog is static |
 * | platforms[].status       | registry; no platform is Live (no integration in web/worker)             | never                      |
 * | platforms[].plans        | registry: planned capabilities, not facts                                | never                      |
 * | connections (session)    | GET /api/connections (not built yet); preview state from Platform-Detail | nothing connected          |
 * | everywhere               | canvas Settings-Connections copy; registerPost publishedUrl (api.ts)     | never                      |
 *
 * States (C28): success = the catalog (a filter or search with no match shows the empty view; Live does today);
 * loading = reading connections; error = connections could not be read.
 */
import { Alert, Button } from '../../ui/primitives';
import { StateView } from '../../ui/composites/StateView';
import { EmptyState } from '../../ui/composites/EmptyState';
import { GrowthFrame } from './components/GrowthFrame';
import { GrowthPlatformControls } from './components/GrowthPlatformControls';
import { GrowthPlatformGroup } from './components/GrowthPlatformGroup';
import { usePlatformCatalog } from './usePlatformCatalog';
import type { PlatformsData, ScreenProps } from './types';

const noMatchCopy = {
  live: { title: 'Nothing is live yet', body: 'No platform publishes yet. X and LinkedIn are next.' },
  search: { title: 'No platform matches', body: 'Try another name, or show every status.' },
};

export function Platforms({ data, state = 'success' }: ScreenProps<PlatformsData>) {
  const flow = usePlatformCatalog(data);
  const clear = () => {
    flow.setFilter('all');
    flow.setQuery('');
  };
  const copy = flow.filter === 'live' ? noMatchCopy.live : noMatchCopy.search;
  const noMatch = <EmptyState title={copy.title} body={copy.body} actions={<Button variant="secondary" onClick={clear}>Show all platforms</Button>} />;
  return (
    <GrowthFrame
      section="platforms"
      title="Platforms"
      tag="COMING SOON"
      intro="Every place your brand can post, grouped by kind. Each shows its status, what JamJam plans to do there and how to connect."
      meta="Drawn, not built. Defined in: issue #82 (Platforms page); M2 channel registry."
    >
      <Alert tone="info" title="Works everywhere today">{data.everywhere}</Alert>
      <GrowthPlatformControls filter={flow.filter} onFilter={flow.setFilter} query={flow.query} onQuery={flow.setQuery} count={flow.count} />
      <StateView
        state={flow.count === 0 ? 'empty' : state}
        views={{ empty: noMatch }}
        loading={{ title: 'Loading platforms', body: 'Reading which accounts are connected.' }}
        error={{ title: 'Could not load your connections', body: 'Connection status could not be read. Reload the page in a minute.' }}
      >
        {flow.groups.map((g) => <GrowthPlatformGroup key={g.kind} label={g.label} platforms={g.platforms} connections={flow.connections} />)}
      </StateView>
    </GrowthFrame>
  );
}
