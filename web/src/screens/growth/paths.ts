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
} as const satisfies Record<string, ArtboardName>;

/** Query keys these screens read: `platform` picks the Platform-Detail platform. */
export const growthParams = { platform: 'platform' } as const;

export interface GrowthLinks {
  to: (artboard: ArtboardName) => string;
  /** Platform-Detail opened on one platform. */
  platform: (id: string) => string;
}

export function useGrowthLinks(): GrowthLinks {
  const href = useScreenHref();
  return {
    to: (artboard) => href(artboard),
    platform: (id) => {
      const path = href(growthArtboards.platformDetail);
      return `${path}${path.includes('?') ? '&' : '?'}${growthParams.platform}=${encodeURIComponent(id)}`;
    },
  };
}

/** The `?platform=` value, or null. */
export function usePlatformParam(): string | null {
  const [params] = useSearchParams();
  return params.get(growthParams.platform);
}
