/*
 * Data contract: VerifyLedgerScreen, artboard Ledger (canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn,
 * page "Verify + ledger", board Ledger and note n-led; issue #49).
 * Backend map: .agentic/what/context/backend_map.md §4, row "Ledger" (GET /api/ledger; tables registrations, payouts;
 * explorer links). Shape: LedgerData in ./types.ts. Kits and posts only, no licensing rows (n-led, ADR-003).
 *
 * | Field                   | Source                                                             | Empty when                  |
 * |-------------------------|--------------------------------------------------------------------|-----------------------------|
 * | brands[]                | brands with a registration (name, domain, current kit version)    | never (public brands list)  |
 * | entries[].type/date     | registrations.kind and registered_at                              | "[date]" while bracketed    |
 * | entries[].what/hash     | kit_versions.version and hash, or the post label                  | "[sha256]" while bracketed  |
 * | entries[].text          | drafts.text of a registered post, for "Check it"                  | kit rows                    |
 * | entries[].approver      | registrations.approver_id -> profiles                             | "[approver]"                |
 * | entries[].signature     | registrations tx signature (SAS attestation by the Registrar)     | "[tx]" while pending        |
 * | ambassador payouts      | payouts (coming soon, ADR-008)                                    | always "Coming soon"        |
 * | pageSize                | GET /api/ledger page size                                         | n/a                         |
 *
 * States (C28): success = rows; empty = nothing registered for the brand; loading = skeleton rows and totals;
 * error = could not load, Try again. Sample rows until #36 registers JamJam's kit and post (canvas chip).
 * Presentational: no network call. The live /ledger screen (screens/ledger) is unchanged.
 */
import { Text } from '../../ui/primitives';
import { SampleFlag } from '../../ui/composites/SampleFlag';
import { BrandSwitcher } from '../../ui/domain/BrandSwitcher';
import { VerifyPagination } from '../../ui/domain/VerifyPagination';
import { VerifyLedgerControls } from './components/VerifyLedgerControls';
import { VerifyLedgerSummary } from './components/VerifyLedgerSummary';
import { VerifyLedgerTable } from './components/VerifyLedgerTable';
import { VerifyPageFrame } from './components/VerifyPageFrame';
import { VerifyPageHeader } from './components/VerifyPageHeader';
import type { LedgerData, ScreenProps } from './types';
import { useLedger } from './useLedger';

export function VerifyLedgerScreen({ data, state = 'success' }: ScreenProps<LedgerData>) {
  const ledger = useLedger(data, state);
  return (
    <VerifyPageFrame>
      <VerifyPageHeader
        title="Public ledger"
        tag="HACKATHON"
        intro="Every approved kit and post a brand has registered on Solana, with a transaction anyone can open."
        aside={<BrandSwitcher brands={data.brands} currentId={ledger.brand.id} onSelect={ledger.setBrand} />}
      />
      <VerifyLedgerSummary brand={ledger.brand} stats={ledger.stats} loading={ledger.status === 'loading'} />
      <VerifyLedgerControls filter={ledger.filter} onFilter={ledger.setFilter} sort={ledger.sort} onSort={ledger.setSort} />
      <VerifyLedgerTable brandName={ledger.brand.name} rows={ledger.rows} status={ledger.status} onRetry={ledger.retry} />
      <VerifyPagination label="Ledger pages" page={ledger.page} pageCount={ledger.pageCount} onChange={ledger.setPage} />
      <Text variant="small" tone="secondary">
        Only hashes, versions and ids are on-chain; the words stay with the brand. <SampleFlag /> until #36 registers JamJam's kit and post.
      </Text>
    </VerifyPageFrame>
  );
}
