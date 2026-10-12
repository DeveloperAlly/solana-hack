import { Badge, type BadgeTone } from '../../../ui/primitives/Badge';
import type { ConnectionStatus as Status } from '../types';

const view: Record<Status, { label: string; tone: BadgeTone }> = {
  connected: { label: 'Connected', tone: 'neutral' },
  'connected-bot': { label: 'Connected (bot)', tone: 'neutral' },
  collecting: { label: 'Collecting…', tone: 'solid' },
  'sync-error': { label: 'Sync error', tone: 'warning' },
  'not-connected': { label: 'Not connected', tone: 'neutral' },
  'default-on': { label: 'On by default', tone: 'neutral' },
};

/** D41 status chip for a source connection (Inbox-Connect, Analytics-Empty). */
export function ConnectionStatus({ status }: { status: Status }) {
  const v = view[status];
  return <Badge tone={v.tone}>{v.label}</Badge>;
}
