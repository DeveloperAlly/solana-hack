import { useState } from 'react';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import type { CheckStatus } from './useVerifyCheck';
import type { LookupKind, LookupRecord, VerifyLookupData } from './types';

export type LookupTab = LookupKind | 'post';

export interface LookupCheck {
  status: CheckStatus;
  /** The registered record, or null when nothing matches. */
  record: LookupRecord | null;
  inputError: string | null;
}

export interface VerifyLookupFlow {
  tab: LookupTab;
  setTab: (tab: LookupTab) => void;
  query: Record<LookupKind, string>;
  /** Per-tab check state: switching tabs keeps each tab's text and result. */
  checks: Record<LookupKind, LookupCheck>;
  check: (kind: LookupKind, text: string) => void;
}

const startStatus: Record<ScreenState, CheckStatus> = { success: 'done', empty: 'idle', loading: 'checking', error: 'error' };
const kinds: LookupKind[] = ['account', 'kit', 'claim'];

const normaliseKey = (s: string) => s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');

export function findRecord(records: LookupRecord[], kind: LookupKind, text: string): LookupRecord | null {
  const key = normaliseKey(text);
  return records.find((r) => r.kind === kind && normaliseKey(r.key) === key) ?? null;
}

/**
 * Flow state for Verify-4 (account, kit version or claim): the open tab, each tab's text and its result.
 * The demo state sets where the open tab starts; the other tabs start unchecked.
 */
export function useVerifyLookup(data: VerifyLookupData, state: ScreenState): VerifyLookupFlow {
  const [tab, setTab] = useState<LookupTab>(data.initialTab);
  const startQuery = (k: LookupKind) => (state === 'empty' ? '' : data.queries[k]);
  const [query, setQuery] = useState(() => Object.fromEntries(kinds.map((k) => [k, startQuery(k)])) as Record<LookupKind, string>);
  const [checks, setChecks] = useState(
    () =>
      Object.fromEntries(
        kinds.map((k) => {
          const status: CheckStatus = k === data.initialTab ? startStatus[state] : 'idle';
          return [k, { status, record: findRecord(data.records, k, startQuery(k)), inputError: null }];
        }),
      ) as Record<LookupKind, LookupCheck>,
  );

  function check(kind: LookupKind, text: string) {
    const inputError = text ? null : 'Enter something to check.';
    // INTEGRATION: GET /api/verify/{account,kit,claim}?q= (backend map row "Verify-1, Verify-2, Verify-3").
    setQuery((q) => ({ ...q, [kind]: text }));
    setChecks((c) => ({
      ...c,
      [kind]: inputError ? { ...c[kind], inputError } : { status: 'done', record: findRecord(data.records, kind, text), inputError: null },
    }));
  }

  return { tab, setTab, query, checks, check };
}
