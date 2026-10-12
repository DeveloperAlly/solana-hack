// The Grow screens' data per brand (Codex review on PR 111): every brand-scoped growth screen reads its data from the
// one active brand, through screens/loop loopDataFor and ActiveBrandLoop, the same path the loop screens use, so the
// data and the brand-scoped loop store (decisions, payouts) always belong to the same brand. aDNA has the canvas data;
// a first-run brand has real empty data (no quests, events, referrals, tips or team yet), with its own name. A screen
// a first-run brand cannot have yet (one event's plan, adapting a post it has not approved) has no data, and says so.
// Public pages (Events-Board, the landings, Tip-Sheet, Invite-Accept) are not scoped to the signed-in brand.
import type { AdaptData, BadgeEmbedData, EventDetailData, EventsData, GrowHomeData, QuestsData, ReferralData, TeamData, TipsReceivedData } from './types';
import { adapt, adaptNoneChosen } from './adapt.fixtures';
import { badgeEmbed, badgeEmbedEmpty } from './badge.fixtures';
import { eventDetail, eventDetailCancelled, eventDetailPlanEmpty, events, eventsEmpty } from './events.fixtures';
import { growHome, growHomeFirstRun } from './growHome.fixtures';
import { quests, questsEmpty } from './quests.fixtures';
import { referral, referralEmpty } from './referral.fixtures';
import { team, teamEmpty } from './team.fixtures';
import { tipsReceived, tipsReceivedEmpty } from './tips.fixtures';

/** One screen's data for a brand: its default, and the variants its demo states show. */
export interface BrandVariants<D> {
  success: D;
  empty?: D;
  error?: D;
}

export interface GrowBrandData {
  growHome: BrandVariants<GrowHomeData>;
  adapt?: BrandVariants<AdaptData>;
  events: BrandVariants<EventsData>;
  eventDetail?: BrandVariants<EventDetailData>;
  quests: BrandVariants<QuestsData>;
  referral: BrandVariants<ReferralData>;
  badge: BrandVariants<BadgeEmbedData>;
  tips: BrandVariants<TipsReceivedData>;
  team: BrandVariants<TeamData>;
}

const adnaFixtures: GrowBrandData = {
  growHome: { success: growHome, empty: growHomeFirstRun },
  adapt: { success: adapt, empty: adaptNoneChosen },
  events: { success: events, empty: eventsEmpty },
  eventDetail: { success: eventDetail, empty: eventDetailPlanEmpty, error: eventDetailCancelled },
  quests: { success: quests, empty: questsEmpty },
  referral: { success: referral, empty: referralEmpty },
  badge: { success: badgeEmbed, empty: badgeEmbedEmpty },
  tips: { success: tipsReceived, empty: tipsReceivedEmpty },
  team: { success: team, empty: teamEmpty },
};

/** Applies `f` to a screen's every variant, keeping identity where success and empty are the same object (first run). */
function mapVariants<D>(v: BrandVariants<D>, f: (d: D) => D): BrandVariants<D> {
  const success = f(v.success);
  return { success, empty: v.empty === v.success ? success : v.empty && f(v.empty), error: v.error && f(v.error) };
}

/**
 * The one place a Grow dataset gets its brand's name: every dataset that names the signed-in brand (Grow-Home, its
 * events, Events, Event-Detail, the team, tips received) is stamped with the active brand's name here, never from a
 * fixture literal or screen copy (Codex review on PR 111).
 */
export function withBrand(g: GrowBrandData, brand: string): GrowBrandData {
  const events = mapVariants(g.events, (d) => ({ ...d, brand }));
  return {
    ...g,
    growHome: mapVariants(g.growHome, (d) => ({ ...d, brand, events: { ...d.events, brand } })),
    events,
    eventDetail: g.eventDetail && mapVariants(g.eventDetail, (d) => ({ ...d, brand })),
    team: mapVariants(g.team, (d) => ({ ...d, brand })),
    tips: mapVariants(g.tips, (d) => ({ ...d, creator: brand })),
  };
}

export const adnaGrow: GrowBrandData = withBrand(adnaFixtures, 'aDNA');

/** The same object for success and empty: a first-run brand's data is its empty data (resolveState shows it as empty). */
const only = <D,>(d: D): BrandVariants<D> => ({ success: d, empty: d });

/** A first-run brand's Grow data: nothing yet, under its own name; quest suggestions are bracketed until its kit exists. */
export function firstRunGrow(name: string): GrowBrandData {
  return withBrand({
    growHome: only(growHomeFirstRun),
    events: only(eventsEmpty),
    quests: only({
      ...questsEmpty,
      suggestions: questsEmpty.suggestions.map((s) => ({ ...s, task: `[A ${s.format} task suggested from the ${name} kit]` })),
    }),
    referral: only(referralEmpty),
    badge: only(badgeEmbedEmpty),
    tips: only(tipsReceivedEmpty),
    team: only(teamEmpty),
  }, name);
}
