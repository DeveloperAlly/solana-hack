// Link targets for the Growth page (issue #82). Paths come from the gallery's shared screenPath / useScreenHref
// (web/src/gallery/screenPath.ts), which keep ?theme=; this file only names the artboards and adds the page params.
import { useSearchParams } from 'react-router';
import { useScreenHref } from '../../gallery/screenPath';
import type { ArtboardName } from '../../config/artboards';

export const growthArtboards = {
  platforms: 'Platforms',
  platformDetail: 'Platform-Detail',
  referral: 'Referral',
  referralLanding: 'Referral-Landing',
  badge: 'Badge-Embed',
  badgeLanding: 'Verify-Badge-Landing',
  tip: 'Tip-Sheet',
  tips: 'Tips-Received',
  team: 'Invite-Team',
  accept: 'Invite-Accept',
  growHome: 'Grow-Home',
  adapt: 'Distribute-Adapt',
  events: 'Events',
  eventDetail: 'Event-Detail',
  eventsBoard: 'Events-Board',
  eventRating: 'Event-Rating',
} as const satisfies Record<string, ArtboardName>;

/** Query keys these screens read: `platform` picks the Platform-Detail platform; `event` the event on Event-Detail and Event-Rating. */
export const growthParams = { platform: 'platform', event: 'event' } as const;
type GrowthParam = keyof typeof growthParams;

export interface GrowthLinks {
  to: (artboard: ArtboardName) => string;
  /** Platform-Detail opened on one platform. */
  platform: (id: string) => string;
  /** Event-Detail opened on one brand event. */
  event: (id: string) => string;
  /** Event-Rating opened on one board event. */
  rating: (id: string) => string;
}

export function useGrowthLinks(): GrowthLinks {
  const href = useScreenHref();
  const withParam = (artboard: ArtboardName, key: GrowthParam, value: string) => {
    const path = href(artboard);
    return `${path}${path.includes('?') ? '&' : '?'}${growthParams[key]}=${encodeURIComponent(value)}`;
  };
  return {
    to: (artboard) => href(artboard),
    platform: (id) => withParam(growthArtboards.platformDetail, 'platform', id),
    event: (id) => withParam(growthArtboards.eventDetail, 'event', id),
    rating: (id) => withParam(growthArtboards.eventRating, 'event', id),
  };
}

/** A growth query value (`?platform=`, `?event=`), or null. */
export function useGrowthParam(key: GrowthParam): string | null {
  const [params] = useSearchParams();
  return params.get(growthParams[key]);
}

/** The `?platform=` value, or null. */
export const usePlatformParam = (): string | null => useGrowthParam('platform');
