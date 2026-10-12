import { useId } from 'react';
import { DataTable, type DataTableColumn } from '../composites/DataTable';
import styles from './SoonPayoutTable.module.css';

export interface SoonPayoutRow {
  id: string;
  format: string;
  where: string;
  /** Payout per approved piece, as typed (USDC). */
  payout: string;
}

export interface SoonPayoutTableProps {
  caption: string;
  rows: SoonPayoutRow[];
  onChange: (id: string, payout: string) => void;
  /** Currency shown in the column header. */
  currency?: string;
}

/** Client check for a payout cell: a number of zero or more. */
export function payoutError(value: string): string | null {
  const n = Number(value);
  return value.trim() === '' || !Number.isFinite(n) || n < 0 ? 'Enter an amount of 0 or more.' : null;
}

/** D26 PayoutTable: format, where it is published, and an editable payout per approved piece, checked as you type. */
export function SoonPayoutTable({ caption, rows, onChange, currency = 'USDC' }: SoonPayoutTableProps) {
  const base = useId();
  const columns: DataTableColumn<SoonPayoutRow>[] = [
    { key: 'format', header: 'Format', rowHeader: true },
    { key: 'where', header: 'Where' },
    {
      key: 'payout',
      header: `Payout (${currency})`,
      cell: (row) => {
        const error = payoutError(row.payout);
        const errId = `${base}-${row.id}-err`;
        return (
          <span className={styles.cell}>
            <input
              className={styles.input}
              inputMode="decimal"
              aria-label={`${row.format} payout`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errId : undefined}
              value={row.payout}
              onChange={(e) => onChange(row.id, e.target.value)}
            />
            {error && <span id={errId} className={styles.error}>{error}</span>}
          </span>
        );
      },
    },
  ];
  return <DataTable caption={caption} columns={columns} rows={rows} rowKey={(r) => r.id} />;
}
