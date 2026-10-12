import { useMemo, useState } from 'react';
import { platformKinds, type Platform, type PlatformKind } from '../../config/platforms';
import { growthSession } from './session';
import type { ConnectionState, PlatformFilter, PlatformsData } from './types';

export interface PlatformGroup {
  kind: PlatformKind;
  label: string;
  platforms: Platform[];
}

export interface PlatformCatalog {
  filter: PlatformFilter;
  setFilter: (f: PlatformFilter) => void;
  query: string;
  setQuery: (q: string) => void;
  /** Kinds with at least one platform matching the filter and search, in catalog order. */
  groups: PlatformGroup[];
  /** How many platforms match. */
  count: number;
  connections: Record<string, ConnectionState>;
}

/** Platforms flow state: the status filter and the search, applied to the catalog, plus preview connections. */
export function usePlatformCatalog(data: PlatformsData): PlatformCatalog {
  const [filter, setFilter] = useState<PlatformFilter>('all');
  const [query, setQuery] = useState('');
  const [session] = growthSession.use();
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = data.platforms.filter((p) => (filter === 'all' || p.status === filter) && (!q || p.name.toLowerCase().includes(q)));
    return platformKinds
      .map((k) => ({ kind: k.id, label: k.label, platforms: shown.filter((p) => p.kind === k.id) }))
      .filter((g) => g.platforms.length > 0);
  }, [data.platforms, filter, query]);
  const count = groups.reduce((n, g) => n + g.platforms.length, 0);
  return { filter, setFilter, query, setQuery, groups, count, connections: session.connections };
}
