import { useEffect, useState } from 'react';
import { PublicShell } from '../../ui/shells/PublicShell';
import { Alert, Container, Heading, Link, Stack, Text } from '../../ui/primitives';
import { api, ApiError } from '../../lib/api';

interface Row { type: string; brand: string; version?: number; kitVersion?: number | null; hash: string; at: string; explorer: string | null }

/** Ledger (S6): the latest registrations, grouped by type: brand name, fingerprint, version, explorer link. Content stays private. */
export function Ledger() {
  const [data, setData] = useState<{ kits: Row[]; content: Row[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ kits: Row[]; content: Row[] }>('/ledger').then(setData).catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load the ledger.'));
  }, []);
  const group = (title: string, rows: Row[], label: (r: Row) => string) => (
    <Stack gap={3}>
      <Heading level={2} size="lg">{title} ({rows.length})</Heading>
      {rows.length === 0 ? <Text tone="secondary">None yet.</Text> : (
        <Stack gap={3} as="ul">
          {rows.map((r) => (
            <li key={r.hash + r.at}>
              <Stack gap={1}>
                <Text>{r.brand} · {label(r)} · {new Date(r.at).toLocaleString()}</Text>
                <Text variant="mono" truncate>{r.hash}</Text>
                {r.explorer && <Link href={r.explorer} external>Explorer</Link>}
              </Stack>
            </li>
          ))}
        </Stack>
      )}
    </Stack>
  );
  return (
    <PublicShell>
      <Container width="app">
        <Stack gap={6}>
          <Stack gap={2}>
            <Heading level={1}>Ledger</Heading>
            <Text tone="secondary">The latest 50 kits and 50 posts registered on Solana devnet: the brand, its fingerprint and a link to the transaction. The content itself stays private.</Text>
          </Stack>
          {error && <Alert tone="danger">{error}</Alert>}
          {!data && !error && <Text tone="secondary">Loading…</Text>}
          {data && group('Brand kits', data.kits, (r) => `kit v${r.version}`)}
          {data && group('Posts', data.content, (r) => `post on kit v${r.kitVersion}`)}
        </Stack>
      </Container>
    </PublicShell>
  );
}
