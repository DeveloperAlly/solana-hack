/*
 * Data contract: Grow-Home (canvas v21 page "5 · Grow your reach", board Grow-Home, COMING SOON; ADR-012 #86: the Grow
 * step's home). Backend map: .agentic/what/context/backend_map.md §4 rows for ambassadors and campaigns (Dashboard,
 * Campaign-v2); events and referrals are not in it yet. Shapes: GrowHomeData in ./types.ts.
 *
 * | Field             | Source                                                                             | Empty when        |
 * |-------------------|------------------------------------------------------------------------------------|-------------------|
 * | stats.ambassadors | GET /api/ambassadors (not built yet): seats and public-campaign joiners            | first run         |
 * | stats.campaign    | GET /api/campaigns/:id (not built yet): verified posts toward the goal             | first run         |
 * | events            | the Events data (./types.ts EventsData): upcoming count and the next event          | first run         |
 * | referral          | the Referral data (./types.ts ReferralData): referrals sent                         | first run         |
 * | areas[]           | static: the Grow tabs (config/nav.ts) as the board's cards                          | never             |
 *
 * States (canvas note on the board): success; empty = first run (each card teaches its first action); loading; error.
 */
import { Button, Grid } from '../../ui/primitives';
import { StatTile } from '../../ui/composites/StatTile';
import { StateView } from '../../ui/composites/StateView';
import { GrowAreaCard } from '../../ui/domain/GrowAreaCard';
import { LoopFrame } from './components/LoopFrame';
import { useGrowthLinks } from './paths';
import { useGrowHome } from './useGrowHome';
import type { GrowHomeData, ScreenProps } from './types';

export function GrowHome({ data, state = 'success' }: ScreenProps<GrowHomeData>) {
  const stats = useGrowHome(data);
  const links = useGrowthLinks();
  const firstRun = state === 'empty';
  return (
    <LoopFrame artboard="Grow-Home" title="Grow your reach" tag="COMING SOON"
      intro={`People who post for ${data.brand}, the moments that matter, and the campaigns that tie them together. All of it from your kit, all of it verified.`}
      meta="Drawn, not built. Defined in: canvas v21 Grow-Home; ADR-012. Referral offer from pitch deck v2."
      actions={<Button href={links.to('Campaign-v2-1-Goal')}>New campaign</Button>}>
      <StateView state={state === 'empty' ? 'success' : state}
        loading={{ title: 'Loading Grow', body: 'Counting ambassadors, events, campaigns and referrals.' }}
        error={{ title: 'Could not load Grow', body: 'The counts could not be read. Reload the page in a minute.' }}>
        <Grid min="sm">
          {stats.map((s) => <StatTile key={s.label} label={s.label} value={s.value} sub={s.sub} href={links.to(s.artboard)} />)}
        </Grid>
        <Grid min="md">
          {data.areas.map((a) => (
            <GrowAreaCard key={a.id} title={a.title} body={a.body}
              links={a.links.map((l) => ({ label: l.label, href: links.to(l.artboard) }))}
              firstAction={firstRun ? { text: a.firstAction.text, link: { label: a.firstAction.link.label, href: links.to(a.firstAction.link.artboard) } } : undefined} />
          ))}
        </Grid>
      </StateView>
    </LoopFrame>
  );
}
