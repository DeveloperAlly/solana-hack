// Status chip labels for this page, in one lookup (issue #51). Labels are the canvas chip text on the board named.
import type { BadgeTone } from '../../ui/primitives/Badge';
import type { AudienceFit, ClaimStatus } from './types';

export const soonStatus = {
  'not-connected': { label: 'Not connected', tone: 'neutral' }, // Settings-AI, Settings-Connections
  connected: { label: 'Connected', tone: 'success' },
  'in-use': { label: 'In use', tone: 'solid' }, // Settings-AI
  'not-set': { label: 'Not set', tone: 'neutral' }, // Settings-AI
  expired: { label: 'Expired', tone: 'warning' }, // Settings-Connections
  always: { label: 'Always available', tone: 'neutral' }, // Settings-Connections
  'not-linked': { label: 'Not linked', tone: 'neutral' }, // Settings-Connections
  linked: { label: 'Linked', tone: 'success' },
  'self-declared': { label: 'Self-declared', tone: 'neutral' }, // Brand-Switcher
  'domain-verified': { label: 'Domain verified', tone: 'solid' }, // Brand-Switcher
  person: { label: 'Person', tone: 'neutral' }, // Brand-Switcher
  uploaded: { label: 'Uploaded', tone: 'neutral' }, // Founder-Profile
  optional: { label: 'Optional', tone: 'neutral' }, // Founder-Profile
} as const satisfies Record<string, { label: string; tone: BadgeTone }>;

export type SoonStatusId = keyof typeof soonStatus;

/**
 * Toggleable statuses: the row button's label and the status it leads to (Settings-Connections).
 * INTEGRATION: channels -> GET /api/connect/{x,linkedin}/start or DELETE /api/connections/:id;
 * wallet -> POST /api/wallets/link (signMessage challenge), then PUT or DELETE /api/brands/:id/payout-wallet.
 */
export const soonToggle: Partial<Record<SoonStatusId, { label: string; next: SoonStatusId }>> = {
  'not-connected': { label: 'Connect', next: 'connected' },
  expired: { label: 'Reconnect', next: 'connected' },
  connected: { label: 'Disconnect', next: 'not-connected' },
  'not-linked': { label: 'Link wallet', next: 'linked' },
  linked: { label: 'Unlink', next: 'not-linked' },
};

export interface Chip { label: string; tone: BadgeTone }

/** Claims table status (canvas Claims, D19). */
export const claimChips = {
  approved: { label: 'Approved', tone: 'success' },
  pending: { label: 'Pending', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'warning' },
} as const satisfies Record<ClaimStatus, Chip>;

/** Outcome log audience fit (canvas Outcome-Log). */
export const fitChips = {
  yes: { label: 'Yes', tone: 'success' },
  unsure: { label: 'Unsure', tone: 'neutral' },
  no: { label: 'No', tone: 'warning' },
} as const satisfies Record<AudienceFit, Chip>;

/** Filter chips for a DataTable from a chip lookup, "All" first (the DataTable filter contract). */
export const filterOptionsFrom = (chips: Record<string, Chip>) => [{ id: 'all', label: 'All' }, ...Object.entries(chips).map(([id, c]) => ({ id, label: c.label }))];
