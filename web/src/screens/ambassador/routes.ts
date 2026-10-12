// The one route map for the Ambassador page (issue #53). Screens never write paths; they read them from here through
// useAmbassadorFlow. Each step opens its gallery route for that artboard (issue #45, "Where it lives").
// Canvas links followed: https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Amb-1 to Amb-5d and M-1 to M-5.
import type { ArtboardName } from '../../config/artboards';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import type { Device } from './types';

/** Steps of the ambassador flow, in order: campaigns → detail → generate → publish → status. */
export const ambSteps = ['campaigns', 'detail', 'generate', 'publish', 'verifying'] as const;
export type AmbStep = (typeof ambSteps)[number];

/** Status outcomes reached after publishing (canvas Amb-5a "Prototype outcomes"). */
export type AmbOutcomeStep = 'paid' | 'failed' | 'budget';
export type AmbRouteKey = AmbStep | AmbOutcomeStep;

/** A gallery screen to open: its artboard and, when not the default, its state. Hrefs come from the gallery's
 * useScreenHref (src/gallery/screenPath.ts), which keeps the theme; this file never builds a path. */
export interface ScreenTarget {
  /** A canvas board (config/artboards); a misspelled board fails typecheck. */
  artboard: ArtboardName;
  state?: ScreenState;
}
const screen = (artboard: ArtboardName, state?: ScreenState): ScreenTarget => ({ artboard, state });

/** Every artboard this page registers, keyed for the registry. */
export const ambArtboards = {
  campaigns: 'Amb-1-Campaigns',
  campaignsEmpty: 'Amb-1b-CampaignsEmpty',
  detail: 'Amb-2-Detail',
  generate: 'Amb-3-Generate',
  publish: 'Amb-4-Publish',
  verifying: 'Amb-5a-Verifying',
  paid: 'Amb-5b-Paid',
  failed: 'Amb-5c-VerifyFailed',
  budget: 'Amb-5d-BudgetReached',
  mCampaigns: 'M-1-Campaigns',
  mDetail: 'M-2-Detail',
  mGenerate: 'M-3-Generate',
  mPublish: 'M-4-Publish',
  mStatus: 'M-5-Status',
} as const satisfies Record<string, ArtboardName>;

const a = ambArtboards;

/**
 * Where each step goes, per device. Mobile has one status artboard (M-5), so its outcomes are M-5 states; the canvas
 * draws no mobile budget-reached board, so mobile has no `budget` route.
 */
export const ambRoutes: Record<Device, Record<AmbStep | 'paid' | 'failed', ScreenTarget> & { budget?: ScreenTarget }> = {
  desktop: {
    campaigns: screen(a.campaigns),
    detail: screen(a.detail),
    generate: screen(a.generate),
    publish: screen(a.publish),
    verifying: screen(a.verifying),
    paid: screen(a.paid),
    failed: screen(a.failed),
    budget: screen(a.budget),
  },
  mobile: {
    campaigns: screen(a.mCampaigns),
    detail: screen(a.mDetail),
    generate: screen(a.mGenerate),
    publish: screen(a.mPublish),
    verifying: screen(a.mStatus, 'loading'),
    paid: screen(a.mStatus),
    failed: screen(a.mStatus, 'error'),
  },
};

/** Other pages' screens the canvas links to: Amb-5b "See public check" opens Verify-1-Match (issue #49); the logo
 * opens Main (Journey, issue #48); "Change" the connected LinkedIn account opens Settings-Connections (Coming soon,
 * issue #51; backend map row "Settings › Connections"). */
export const otherBoards = {
  verifyMatch: screen('Verify-1-Match'),
  home: screen('Main'),
  settings: screen('Settings-Connections'),
} as const;

/** App routes outside the gallery that the canvas links to (no gallery board does this job). */
export const pageRoutes = {
  signIn: '/sign-in',
} as const;
