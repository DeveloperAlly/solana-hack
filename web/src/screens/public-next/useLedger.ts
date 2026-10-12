import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { verifyParams } from './paths';
import type { LedgerBrand, LedgerData, LedgerEntry, LedgerFilter, LedgerSort } from './types';

export interface LedgerStats {
  kits: number;
  posts: number;
}

export type LedgerStatus = 'ready' | 'loading' | 'error';

// The gallery's demo state (C28) picks where the flow starts; "empty" is ready with no rows (ledgerEmpty fixture).
const startStatus: Record<ScreenState, LedgerStatus> = { success: 'ready', empty: 'ready', loading: 'loading', error: 'error' };

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
  /** Totals for the brand, over every row (not just this page or filter). */
  stats: LedgerStats;
}

/** Newest or oldest first by date; rows still bracketed ("[date]") always sort last, in fixture order. */
export function sortEntries(rows: LedgerEntry[], sort: LedgerSort): LedgerEntry[] {
  const dir = sort === 'newest' ? -1 : 1;
  return [...rows].sort((a, b) => {
    if (a.date === b.date) return 0;
    if (a.date === null) return 1;
    if (b.date === null) return -1;
    return a.date < b.date ? -dir : dir;
  });
}

/**
 * Flow state for the Ledger: the brand (from `?brand=`, else the first), the type filter, the sort and the page.
 * Changing the brand, filter or sort returns to page 1. INTEGRATION: GET /api/ledger?brand=&type=&page= (backend map row "Ledger").
 */
export function useLedger(data: LedgerData, state: ScreenState): LedgerFlow {
  const [status, setStatus] = useState<LedgerStatus>(startStatus[state]);
  const [params] = useSearchParams();
  const requested = params.get(verifyParams.brand);
  const [brandId, setBrandId] = useState(data.brands.some((b) => b.id === requested) ? requested! : data.brands[0].id);
  const [filter, setFilterState] = useState<LedgerFilter>('all');
  const [sort, setSortState] = useState<LedgerSort>('newest');
  const [page, setPage] = useState(1);

  const brand = data.brands.find((b) => b.id === brandId) ?? data.brands[0];
  const brandRows = useMemo(() => data.entries.filter((e) => e.brandId === brand.id), [data.entries, brand.id]);
  const shown = useMemo(
    () => sortEntries(brandRows.filter((e) => filter === 'all' || e.type === filter), sort),
    [brandRows, filter, sort],
  );
  const pageCount = Math.max(1, Math.ceil(shown.length / data.pageSize));
  const current = Math.min(page, pageCount);
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  return {
    status,
    // INTEGRATION: GET /api/ledger again.
    retry: () => setStatus('ready'),
    brand,
    setBrand: reset(setBrandId),
    filter,
    setFilter: reset(setFilterState),
    sort,
    setSort: reset(setSortState),
    page: current,
    setPage,
    pageCount,
    rows: shown.slice((current - 1) * data.pageSize, current * data.pageSize),
    stats: { kits: brandRows.filter((e) => e.type === 'kit').length, posts: brandRows.filter((e) => e.type === 'post').length },
  };
}
