/*
 * Data contract: Outcome-Log (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Outcome-Log; issue #51)
 * Backend map: no row yet; proposed in issue #51. Closest
 * existing table: `leads` (§3 "Experimental or later"); attribution comes from registrations (row "Ledger"). Shape: OutcomeLogData.
 *
 * | Field                | Source                                                        | Empty when          |
 * |----------------------|---------------------------------------------------------------|---------------------|
 * | outcomes[].date      | When the inbound arrived                                      | nothing came in     |
 * | outcomes[].who       | Role and company type only (no third-party personal data)     | never               |
 * | outcomes[].foundVia  | The post or page it traces to (registrations, Verify)         | never               |
 * | outcomes[].fit       | Qualified against the kit's audience: yes / unsure / no       | never               |
 * | outcomes[].repliedIn | Time to the first reply                                       | not replied: "[…]"  |
 * | outcomes[].outcome   | Where it ended up (call booked, open …)                       | open                |
 *
 * States: success, empty, loading, error.
 */
import { Text } from '../../ui/primitives';
import { DataTable } from '../../ui/composites/DataTable';
import { SoonHubFrame } from '../../ui/domain/SoonHubFrame';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { tableState } from './tableState';
import { ChipBadge } from './ChipBadge';
import { filterOptionsFrom, fitChips } from './status';
import type { Outcome, OutcomeLogData } from './types';

const filterOptions = filterOptionsFrom(fitChips);

export function OutcomeLog({ data, state = 'success' }: { data: OutcomeLogData; state?: ScreenState }) {
  return (
    <SoonHubFrame header={{ title: 'What came in', intro: 'Inbound you can trace to your posts, qualified against your audience, through to the outcome.', definedIn: 'canvas board Outcome-Log; no backend row yet (proposed in issue #51)' }}>
      {/* INTEGRATION: no endpoint yet (issue #51); rows will come from leads plus registrations attribution. */}
      <DataTable<Outcome>
        caption="Inbound and outcomes"
        hideCaption
        columns={[
          { key: 'date', header: 'Date', rowHeader: true, sort: (a, b) => a.date.localeCompare(b.date) },
          { key: 'who', header: 'Who (role only)' },
          { key: 'foundVia', header: 'How they found you' },
          { key: 'fit', header: 'Fits your audience?', cell: (o) => <ChipBadge chip={fitChips[o.fit]} />, sort: (a, b) => a.fit.localeCompare(b.fit) },
          { key: 'repliedIn', header: 'Replied in' },
          { key: 'outcome', header: 'Outcome' },
        ]}
        rows={data.outcomes}
        rowKey={(o) => o.id}
        state={tableState[state]}
        filter={{ label: 'Filter by audience fit', options: filterOptions, match: (o, id) => o.fit === id }}
        empty={<Text tone="secondary">Nothing traced yet. Inbound shows up here once someone finds you through a post.</Text>}
        error={<Text tone="danger">Could not load the outcome log. Try again in a minute.</Text>}
      />
      <Text variant="small" tone="secondary">No third-party personal data is stored: roles and company types only.</Text>
    </SoonHubFrame>
  );
}
