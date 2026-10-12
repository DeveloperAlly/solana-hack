/*
 * Data contract: VerifyLookupScreen, artboard Verify-4-Kit-Account-Claim (canvas
 * https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, page "Coming soon", board Verify-4-Kit-Account-Claim; issue #49).
 * COMING SOON: drawn, not built (PRD #2 verify badge and official accounts; backlog row L3a).
 * Backend map: .agentic/what/context/backend_map.md §4, row "Verify-1, Verify-2, Verify-3" (GET /api/verify/{kit,account,claim};
 * table registrations). Shape: VerifyLookupData in ./types.ts.
 *
 * | Field               | Source                                                                   | Empty when              |
 * |---------------------|--------------------------------------------------------------------------|-------------------------|
 * | initialTab          | Client: the tab the visitor opened (canvas shows Account)                | n/a                     |
 * | queries.{kind}      | Client: the text typed into each tab                                     | nothing typed           |
 * | records[].kind/key  | registrations of kind account (identity attestation), kit or claim      | none registered         |
 * | records[].title     | built from the brand name and kind ("Official account of JamJam")        | n/a                     |
 * | records[].registeredAt / signature | registrations.registered_at and tx signature              | "[date]", "[tx]"        |
 * | note, errorNote     | Canvas proto note; request failure                                       | n/a                     |
 *
 * States (C28) apply to the open tab: success = result; empty = nothing typed; loading = checking; error = Try again.
 * Presentational: no network call.
 */
import { Tabs } from '../../ui/composites/Tabs';
import { VerifyLookupPanel } from './components/VerifyLookupPanel';
import { VerifyLookupPostTab } from './components/VerifyLookupPostTab';
import { VerifyPageFrame } from './components/VerifyPageFrame';
import { VerifyPageHeader } from './components/VerifyPageHeader';
import type { LookupKind, ScreenProps, VerifyLookupData } from './types';
import { useVerifyLookup, type LookupTab } from './useVerifyLookup';

const lookupTabs: { id: LookupKind; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'kit', label: 'Kit version' },
  { id: 'claim', label: 'Claim' },
];

export function VerifyLookupScreen({ data, state = 'success' }: ScreenProps<VerifyLookupData>) {
  const flow = useVerifyLookup(data, state);
  const panels = lookupTabs.map((t) => ({
    ...t,
    panel: <VerifyLookupPanel key={t.id} kind={t.id} query={flow.query[t.id]} draft={flow.draft[t.id]} onDraft={flow.setDraft} check={flow.checks[t.id]} onCheck={flow.check} errorNote={data.errorNote} />,
  }));
  return (
    <VerifyPageFrame>
      <VerifyPageHeader title="Is this official?" tag="COMING SOON" intro="Check a post, a kit version, an account or a claim." note={data.note} />
      <Tabs
        label="What to check"
        value={flow.tab}
        onChange={(id) => flow.setTab(id as LookupTab)}
        items={[{ id: 'post', label: 'Post', panel: <VerifyLookupPostTab /> }, ...panels]}
      />
    </VerifyPageFrame>
  );
}
