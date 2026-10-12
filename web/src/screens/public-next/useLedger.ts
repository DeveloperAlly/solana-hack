import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { useTableView } from '../../ui/hooks/useTableView';
import { verifyParams } from './paths';
import type { LedgerBrand, LedgerData, LedgerEntry, LedgerFilter, LedgerSort } from './types';

export type LedgerStatus = 'ready' | 'loading' | 'error';

export interface LedgerStats {
  kits: number;
  posts: number;
}

// The gallery's demo state (C28) picks where the flow starts; "empty" is ready with no rows (ledgerEmpty fixture).
const startStatus: Record<ScreenState, LedgerStatus> = { success: 'ready', empty: 'ready', loading: 'loading', error: 'error' };

/** Ascending by date. A row still bracketed ("[date]") has no known date and counts as the latest. */
export function compareDate(a: LedgerEntry, b: LedgerEntry): number {
  if (a.date === b.date) return 0;
  if (a.date === null) return 1;
  if (b.date === null) return -1;
  return a.date < b.date ? -1 : 1;
}

const comparators = { date: compareDate };
const matchType = (row: LedgerEntry, option: string) => row.type === option;

export interface LedgerFlow {
  status: LedgerStatus;
  /** Error state: load again (locally this shows the rows). */
  retry: () => void;
  brand: LedgerBrand;
  setBrand: (id: string) => void;
  filter: LedgerFilter;
  setFilter: (f: LedgerFilter) => void;
  sort: LedgerSort;
  setSort: (s: LedgerSort) => void;
  page: number;
  setPage: (p: number) => void;
  pageCount: number;
  /** The rows on the current page, filtered and sorted. */
  rows: LedgerEntry[];
  /** Totals for the brand over every row, whatever the filter or page. */
  stats: LedgerStats;
}

/**
 * Flow state for the Ledger: the brand (from `?brand=`, else the first), then the type filter and date sort (the
 * foundation's useTableView), then the page. Changing the brand, filter or sort returns to page 1.
 * INTEGRATION: GET /api/ledger?brand=&type=&sort=&page= (backend map row "Ledger").
 */
export function useLedger(data: LedgerData, state: ScreenState): LedgerFlow {
  const [params] = useSearchParams();
  const requested = params.get(verifyParams.brand);
  const [status, setStatus] = useState<LedgerStatus>(startStatus[state]);
  const [brandId, setBrandId] = useState(() => data.brands.find((b) => b.id === requested)?.id ?? data.brands[0].id);
  const [page, setPage] = useState(1);

  const brand = data.brands.find((b) => b.id === brandId) ?? data.brands[0];
  const brandRows = useMemo(() => data.entries.filter((e) => e.brandId === brand.id), [data.entries, brand.id]);
  const table = useTableView({ rows: brandRows, comparators, match: matchType, initialSort: { key: 'date', direction: 'descending' } });

  const sort: LedgerSort = table.sort?.direction === 'ascending' ? 'oldest' : 'newest';
  const pageCount = status === 'ready' ? Math.max(1, Math.ceil(table.view.length / data.pageSize)) : 1;
  const current = Math.min(page, pageCount);

  return {
    status,
    // INTEGRATION: GET /api/ledger again.
    retry: () => setStatus('ready'),
    brand,
    setBrand: (id) => { setBrandId(id); setPage(1); },
    filter: table.filter as LedgerFilter,
    setFilter: (f) => { table.setFilter(f); setPage(1); },
    sort,
    // useTableView toggles direction on the same key, so only toggle when the choice changes.
    setSort: (s) => { if (s !== sort) table.sortBy('date'); setPage(1); },
    page: current,
    setPage,
    pageCount,
    rows: table.view.slice((current - 1) * data.pageSize, current * data.pageSize),
    stats: { kits: brandRows.filter((e) => e.type === 'kit').length, posts: brandRows.filter((e) => e.type === 'post').length },
  };
}
