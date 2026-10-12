import { findPlatform } from '../../../config/platforms';
import type { SelectOption as FieldOption } from '../../../ui/primitives/Select';
import { MANUAL_ROUTE, SCHEDULE_ROUTE } from './draftStatus';

/** Post now through the connected account. */
export const NOW_ROUTE = 'now';

/**
 * Where a draft can go, from its channel (Codex review on PR #81). The platform registry (config/platforms.ts) is the
 * one source: posting now and scheduling are offered only where JamJam plans to publish to that platform; copying,
 * posting it yourself and pasting the URL back works everywhere, so Verify still works (canvas Settings-Connections).
 * A destination that does not fit the channel is never offered.
 */
export function publishRoutesFor(channel: string, brandName: string): FieldOption[] {
  const platform = findPlatform(channel.toLowerCase());
  const direct: FieldOption[] = platform?.plans.includes('publish')
    ? [
        { value: NOW_ROUTE, label: `Post to @[${brandName} ${platform.name} handle] now` },
        { value: SCHEDULE_ROUTE, label: 'Schedule: [suggested slot]' },
      ]
    : [];
  return [...direct, { value: MANUAL_ROUTE, label: 'Copy, post it yourself, paste the URL back' }];
}
