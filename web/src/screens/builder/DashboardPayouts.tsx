import { Link } from '../../ui/primitives';
import { DataTable } from '../../ui/composites/DataTable';
import { EmptyState } from '../../ui/composites/EmptyState';
import { BuilderCopyButton } from '../../ui/domain/BuilderCopyButton';
import { BuilderSection } from './BuilderSection';
import { otherPaths } from './paths';
import type { PayoutRow } from './types';

export interface DashboardPayoutsProps {
  rows: PayoutRow[];
  brandName: string;
  publicPageUrl: string;
}

/** Dashboard "Recent approved ambassador posts" (canvas Dashboard, note n-dash.3: every payout has a receipt link), or its empty state. */
export function DashboardPayouts({ rows, brandName, publicPageUrl }: DashboardPayoutsProps) {
  if (!rows.length) {
    return (
      <EmptyState
        title="No ambassador posts yet"
        body={`When a partner pays to write in ${brandName}'s voice, each piece shows here with its receipt.`}
        actions={<BuilderCopyButton value={publicPageUrl} label="Copy your public page link" />}
      />
    );
  }
  return (
    <BuilderSection title="Recent approved ambassador posts" action={<Link href={otherPaths.ledger}>Full ledger</Link>}>
      <DataTable
        caption="Payouts, with receipts"
        hideCaption
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { key: 'date', header: 'Date' },
          { key: 'piece', header: 'Piece', rowHeader: true },
          { key: 'ambassador', header: 'Ambassador' },
          { key: 'paid', header: 'Paid', align: 'end' },
          { key: 'receipt', header: 'Receipt', cell: (r) => <Link href={r.receiptHref} aria-label={`View receipt for ${r.piece}`}>View</Link> },
        ]}
      />
    </BuilderSection>
  );
}
