import { useState } from 'react';
import type { ConnectionStatus, SourceConnection } from '../types';

/**
 * Source connections in local state (Inbox-Connect, Analytics-Empty): Connect and Reconnect change the row's status
 * and clear the error banner once no source is in error. No OAuth or bot install runs here.
 */
export function useConnections(sources: SourceConnection[], error?: string, connectedAs: ConnectionStatus = 'connected') {
  const [status, setStatus] = useState<Record<string, ConnectionStatus>>(() => Object.fromEntries(sources.map((s) => [s.id, s.status])));
  const [banner, setBanner] = useState(error);
  const rows = sources.map((s) => ({ ...s, status: status[s.id] ?? s.status }));

  function update(next: Record<string, ConnectionStatus>) {
    setStatus(next);
    if (!Object.values(next).includes('sync-error')) setBanner(undefined);
  }

  // INTEGRATION: GET /api/connect/{provider}/start (backend map row "Settings › Connections"); here the row just flips.
  const connect = (id: string) => update({ ...status, [id]: connectedAs });
  // INTEGRATION: DELETE /api/connections/:id (same row).
  const disconnect = (id: string) => update({ ...status, [id]: 'not-connected' });
  const reconnectFailed = () =>
    update(Object.fromEntries(Object.entries(status).map(([id, s]) => [id, s === 'sync-error' ? connectedAs : s])));

  return { rows, banner, connect, disconnect, reconnectFailed };
}
