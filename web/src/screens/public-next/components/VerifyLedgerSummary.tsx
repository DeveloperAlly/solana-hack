import { Grid, Stack, Text } from '../../../ui/primitives';
import { Card } from '../../../ui/composites/Card';
import { StatTile } from '../../../ui/composites/StatTile';
import type { LedgerBrand } from '../types';
import type { LedgerStats } from '../useLedger';

export interface VerifyLedgerSummaryProps {
  brand: LedgerBrand;
  stats: LedgerStats;
  loading: boolean;
}

/** The brand line and the three totals above the Ledger table (canvas Ledger; payouts are coming soon, ADR-008). */
export function VerifyLedgerSummary({ brand, stats, loading }: VerifyLedgerSummaryProps) {
  return (
    <>
      <Card as="div">
        <Stack direction="row" gap={3} align="center" wrap>
          <Text as="strong">{brand.name}</Text>
          <Text as="span" variant="small" tone="secondary">
            {brand.domain} · kit v{brand.kitVersion} · registered by the JamJam Registrar; brands never sign
          </Text>
        </Stack>
      </Card>
      <Grid min="sm" gap={4}>
        <StatTile label="Kit versions" value={String(stats.kits)} loading={loading} />
        <StatTile label="Posts registered" value={String(stats.posts)} loading={loading} />
        <StatTile label="Ambassador payouts" value="Coming soon" />
      </Grid>
    </>
  );
}
