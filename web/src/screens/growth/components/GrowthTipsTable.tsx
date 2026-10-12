import { DataTable, type DataTableColumn } from '../../../ui/composites/DataTable';
import { EmptyState } from '../../../ui/composites/EmptyState';
import { VerifyReceiptLink } from '../../../ui/domain/VerifyReceiptLink';
import { formatDateTime, formatUsdc } from '../format';
import type { TipRow } from '../useTipsReceived';

const byNumber = (a: number | null, b: number | null) => (a ?? -1) - (b ?? -1);

const columns: DataTableColumn<TipRow>[] = [
  { key: 'at', header: 'Date', cell: (r) => formatDateTime(r.at), sort: (a, b) => (a.at ?? '').localeCompare(b.at ?? '') },
  { key: 'post', header: 'Post', rowHeader: true, cell: (r) => r.postLabel },
  { key: 'from', header: 'From' },
  { key: 'amount', header: 'Tip', align: 'end', cell: (r) => formatUsdc(r.amount), sort: (a, b) => byNumber(a.amount, b.amount) },
  { key: 'fee', header: 'Fee', align: 'end', cell: (r) => formatUsdc(r.fee) },
  { key: 'net', header: 'You received', align: 'end', cell: (r) => formatUsdc(r.net), sort: (a, b) => byNumber(a.net, b.net) },
  { key: 'receipt', header: 'Receipt', cell: (r) => <VerifyReceiptLink signature={r.signature}>Transfer</VerifyReceiptLink> },
];

/** Every tip received, newest first, sortable and filtered by post; an empty state when there are none. */
export function GrowthTipsTable({ rows, posts }: { rows: TipRow[]; posts: { id: string; label: string }[] }) {
  return (
    <DataTable
      caption="Tips received"
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      empty={<EmptyState title="No tips yet" body="Tips on your verified posts show here. Put the check-it badge on a post so fans can find it." />}
      filter={{ label: 'Filter by post', options: [{ id: 'all', label: 'All posts' }, ...posts], match: (r, id) => id === 'all' || r.postId === id }}
    />
  );
}
