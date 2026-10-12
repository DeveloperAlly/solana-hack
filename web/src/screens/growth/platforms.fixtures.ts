// Sample data for Platforms and Platform-Detail (issue #82). The catalog is the M2 registry (config/platforms.ts),
// where every status, plan and rule cites its source. The two notes below come from canvas copy:
// - everywhere: canvas Settings-Connections, "No connection? Copy the post, publish it yourself, paste the link back
//   so Verify still works · Always available"; the pasted link is registerPost's publishedUrl (web/worker/api.ts).
// - messaging: canvas Inbox-Connect, "Bring your messages into one inbox" (Superhub page, issue #52).
import { platforms } from '../../config/platforms';
import type { PlatformDetailData, PlatformsData } from './types';

const everywhere = 'No connection needed to start: copy an approved post, publish it yourself and paste the link back, so Verify still works on any platform.';

export const platformsCatalog: PlatformsData = { platforms, everywhere };

export const platformDetail: PlatformDetailData = {
  platforms,
  defaultId: 'x',
  messaging: { note: 'Messages from here come into one inbox.', linkLabel: 'Connect messaging on Inbox' },
};
