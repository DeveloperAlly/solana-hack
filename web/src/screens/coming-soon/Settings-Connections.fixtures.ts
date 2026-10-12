// Sample data for Settings-Connections. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn),
// board Settings-Connections, issue #51; backend map §4 row "Settings › Connections"; ADR-006 (wallet only for payouts).
import type { SettingsConnectionsData } from './types';

export const settingsConnections: SettingsConnectionsData = {
  connections: [
    { id: 'linkedin', name: 'LinkedIn', detail: 'post as you', status: 'not-connected' },
    { id: 'x', name: 'X', detail: 'post as the brand', status: 'expired' },
  ],
  fallback: { id: 'manual', name: 'No connection?', detail: 'Copy the post, publish it yourself, paste the link back so Verify still works', status: 'always' },
  wallet: { address: '[address]', status: 'not-linked' },
};

export const settingsConnectionsEmpty: SettingsConnectionsData = {
  ...settingsConnections,
  connections: settingsConnections.connections.map((c) => ({ ...c, status: 'not-connected' })),
};
