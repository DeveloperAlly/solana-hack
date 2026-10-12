import { Button, Link, Text } from '../../../ui/primitives';
import { DataTable, type DataTableColumn } from '../../../ui/composites/DataTable';
import { VerifyReceiptLink } from '../../../ui/domain/VerifyReceiptLink';
import { formatDateTime } from '../format';
import { checkHref } from '../paths';
import type { LedgerEntry } from '../types';
import type { LedgerStatus } from '../useLedger';

const typeLabel: Record<LedgerEntry['type'], string> = { kit: 'Kit', post: 'Post' };

function What({ row }: { row: LedgerEntry }) {
  if (row.type === 'kit') return <>{row.what} · hash <Text as="span" variant="mono">{row.hash ?? '[sha256]'}</Text></>;
  return <>{row.what} · {row.text ? <Link href={checkHref(row.text)}>Check it</Link> : 'Check it'}</>;
}

const columns: DataTableColumn<LedgerEntry>[] = [
  { key: 'date', header: 'Date', rowHeader: true, cell: (r) => formatDateTime(r.date) },
  { key: 'type', header: 'Type', cell: (r) => typeLabel[r.type] },
  { key: 'what', header: 'What', cell: (r) => <What row={r} /> },
  { key: 'kit', header: 'Kit', cell: (r) => `v${r.kitVersion}` },
  { key: 'approver', header: 'Approved by' },
  { key: 'tx', header: 'Transaction', cell: (r) => <VerifyReceiptLink signature={r.signature} /> },
];

export interface VerifyLedgerTableProps {
  brandName: string;
  rows: LedgerEntry[];
  status: LedgerStatus;
  onRetry: () => void;
}

/** D35 LedgerTable on C10 DataTable: kits and posts, each with its transaction; "Check it" opens Verify (canvas n-led). */
export function VerifyLedgerTable({ brandName, rows, status, onRetry }: VerifyLedgerTableProps) {
  return (
    <DataTable
      caption={`${brandName} registrations`}
      hideCaption
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      state={status}
      empty={<Text tone="secondary">{brandName} has nothing registered yet.</Text>}
      error={
        <>
          <Text tone="danger">The ledger could not be loaded just now.</Text>
          <Button variant="secondary" onClick={onRetry}>Try again</Button>
        </>
      }
    />
  );
}
