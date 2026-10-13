// Link targets for the Growth page (issue #82). Paths come from the gallery's shared screenPath / useScreenHref
// (web/src/gallery/screenPath.ts), which keep ?theme=; this file only names the artboards and adds the page params.
import { useSearchParams } from 'react-router';
import { useScreenHref } from '../../gallery/screenPath';
import { activeBrand } from '../../flows/brand/activeBrand';
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
  quests: 'Quests',
} as const satisfies Record<string, ArtboardName>;

/**
 * Query keys these screens read: `platform` picks the Platform-Detail platform; `event` the event on Event-Detail and
 * Event-Rating. A handoff from a brand screen to a public page carries `brand` (whose page it is) and the entity it is
 * about: `invite` (Invite-Accept) or `post` (Verify-Badge-Landing, Tip-Sheet). Without `brand` a public page is a
 * standalone visit and shows its neutral default (Codex review on PR 111).
 */
export const growthParams = { platform: 'platform', event: 'event', brand: 'brand', invite: 'invite', post: 'post' } as const;
type GrowthParam = keyof typeof growthParams;

/** The entity a handoff is about, by query key; a key left undefined is not written. */
export type HandoffEntity = Partial<Record<Exclude<GrowthParam, 'brand'>, string>>;

export interface GrowthLinks {
  to: (artboard: ArtboardName) => string;
  /** Platform-Detail opened on one platform. */
  platform: (id: string) => string;
  /** Event-Detail opened on one brand event. */
  event: (id: string) => string;
  /** A public page opened from a brand screen: the active brand and the entity rides along, so the page is that brand's. */
  fromBrand: (artboard: ArtboardName, entity?: HandoffEntity) => string;
  /** A link between public pages: carries this page's `?brand=` only when it has one, so a standalone visit stays neutral. */
  carry: (artboard: ArtboardName, entity?: HandoffEntity) => string;
}

export function useGrowthLinks(): GrowthLinks {
  const href = useScreenHref();
  const active = activeBrand.use();
  const linked = useGrowthParam('brand');
  const withParams = (artboard: ArtboardName, values: Partial<Record<GrowthParam, string>>) => {
    const path = href(artboard);
    const query = Object.entries(values)
      .filter((kv): kv is [GrowthParam, string] => Boolean(kv[1]))
      .map(([key, value]) => `${growthParams[key]}=${encodeURIComponent(value)}`)
      .join('&');
    if (!query) return path;
    return `${path}${path.includes('?') ? '&' : '?'}${query}`;
  };
  return {
    to: (artboard) => href(artboard),
    platform: (id) => withParams(growthArtboards.platformDetail, { platform: id }),
    event: (id) => withParams(growthArtboards.eventDetail, { event: id }),
    fromBrand: (artboard, entity) => withParams(artboard, { brand: active, ...entity }),
    carry: (artboard, entity) => withParams(artboard, { brand: linked ?? undefined, ...entity }),
  };
}

/** A growth query value (`?platform=`, `?event=`, `?brand=`, `?invite=`, `?post=`), or null. */
export function useGrowthParam(key: GrowthParam): string | null {
  const [params] = useSearchParams();
  return params.get(growthParams[key]);
}

/** The `?platform=` value, or null. */
export const usePlatformParam = (): string | null => useGrowthParam('platform');
