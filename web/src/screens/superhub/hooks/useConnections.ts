import { useState } from 'react';
import type { ConnectionStatus, SourceConnection } from '../types';

export interface ConnectionError {
  message: string;
  /** The source the error is about; reconnecting it clears the banner. */
  source: string;
}

const broken: ConnectionStatus[] = ['sync-error', 'not-connected'];

/**
 * Source connections in local state (Inbox-Connect, Analytics-Empty): Connect, Reconnect and Disconnect change a row's
 * status; the error banner clears once its source is connected again. No OAuth or bot install runs here.
 */
export function useConnections(sources: SourceConnection[], error?: ConnectionError, connectedAs: ConnectionStatus = 'connected') {
  const [status, setStatus] = useState<Record<string, ConnectionStatus>>(() => Object.fromEntries(sources.map((s) => [s.id, s.status])));
  const [banner, setBanner] = useState(error);
  const rows = sources.map((s) => ({ ...s, status: status[s.id] ?? s.status }));

  function update(next: Record<string, ConnectionStatus>) {
    setStatus(next);
    if (banner && !broken.includes(next[banner.source])) setBanner(undefined);
  }

  // INTEGRATION: GET /api/connect/{provider}/start (backend map row "Settings › Connections"); here the row just flips.
  const connect = (id: string) => update({ ...status, [id]: connectedAs });
  // INTEGRATION: DELETE /api/connections/:id (same row).
  const disconnect = (id: string) => update({ ...status, [id]: 'not-connected' });
  const reconnectFailed = () =>
    update(Object.fromEntries(Object.entries(status).map(([id, s]) => [id, s === 'sync-error' || id === banner?.source ? connectedAs : s])));

  return { rows, banner: banner?.message, connect, disconnect, reconnectFailed };
}
