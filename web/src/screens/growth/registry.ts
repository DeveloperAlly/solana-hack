import { createElement, type FunctionComponent } from 'react';
import type { ScreenEntry } from '../registry-types';
import { artboardPages } from '../../config/artboards';
import { screenStates, type ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { Platforms } from './Platforms';
import { PlatformDetail } from './Platform-Detail';
import { Referral } from './Referral';
import { ReferralLanding } from './Referral-Landing';
import { BadgeEmbed } from './Badge-Embed';
import { VerifyBadgeLanding } from './Verify-Badge-Landing';
import { TipSheet } from './Tip-Sheet';
import { TipsReceived } from './Tips-Received';
import { InviteTeam } from './Invite-Team';
import { InviteAccept } from './Invite-Accept';
import { platformDetail, platformsCatalog } from './platforms.fixtures';
import { referralLanding } from './referral.fixtures';
import { verifyBadgeLanding, verifyBadgeLandingEmpty } from './badge.fixtures';
import { tipSheet, tipSheetNoWallet } from './tips.fixtures';
import { inviteAccept, inviteAcceptEmpty } from './team.fixtures';
import { GrowHome } from './Grow-Home';
import { DistributeAdapt } from './Distribute-Adapt';
import { Events } from './Events';
import { EventDetail } from './Event-Detail';
import { EventsBoard } from './Events-Board';
import { EventRating } from './Event-Rating';
import { Quests } from './Quests';
import { ActiveBrandLoop, resolveState } from '../loop/ActiveBrandLoop';
import type { BrandVariants, GrowBrandData } from './brandData';
import { eventRating, eventRatingEmpty, eventsBoard, eventsBoardEmpty } from './board.fixtures';
import type { RouteTag } from '../../config/routes';
import type { ScreenProps } from './types';

// Growth screens (issue #82): distribution screens the pitch deck promises. Canvas v22 now draws them on the Distribute,
// Verify and Grow pages, so each entry's page is its board's page (config/artboards.ts) and its home follows from that
// (config/nav.ts). Nothing is built behind them, so every screen is COMING SOON.
// The ambassador "both" model and the canvas boards are separate sub-tasks of issue #82.

/** Canvas has no empty view for these: a catalog, a detail page or an invite link always has content. */
const noEmpty: readonly ScreenState[] = ['success', 'loading', 'error'];

/** Data per demo state: success is the default; any state without its own data reuses it. */
type Variants<D> = Partial<Record<ScreenState, D>>;

function entry<D>(
  artboard: ScreenEntry['artboard'],
  title: string,
  screen: FunctionComponent<ScreenProps<D>>,
  data: D,
  variants?: Variants<D>,
  tag: RouteTag = 'COMING SOON',
): ScreenEntry {
  return {
    artboard,
    page: artboardPages[artboard],
    title,
    tag,
    states: variants?.empty === undefined ? noEmpty : screenStates,
    render: (state) => createElement(screen, { data: variants?.[state] ?? data, state }),
  };
}

/**
 * A screen scoped to the signed-in brand: its data comes from the one active brand (ActiveBrandLoop, loopDataFor), never
 * a fixture imported here, and its state from that data (resolveState: success on a first-run brand's empty data is the
 * empty state). A brand without data for the screen gets the explicit "nothing here yet" state (Codex review on PR 111).
 */
function brandEntry<D>(
  artboard: ScreenEntry['artboard'],
  title: string,
  screen: FunctionComponent<ScreenProps<D>>,
  select: (g: GrowBrandData) => BrandVariants<D> | undefined,
): ScreenEntry {
  return {
    artboard,
    page: artboardPages[artboard],
    title,
    tag: 'COMING SOON',
    states: screenStates,
    render: (state) => createElement(ActiveBrandLoop, {
      artboard,
      view: (d) => {
        const v = select(d.grow);
        if (!v) return null;
        const byState: Partial<Record<ScreenState, D>> = v;
        const data = byState[state] ?? v.success;
        return createElement(screen, { data, state: resolveState(state, data === v.empty) });
      },
    }),
  };
}

export const screens: ScreenEntry[] = [
  entry('Platforms', 'Platforms: every place a brand can post, by kind', Platforms, platformsCatalog),
  entry('Platform-Detail', 'Platform: plans, posting rules, connect', PlatformDetail, platformDetail),
  brandEntry('Referral', 'Refer a friend: link, offer and referrals', Referral, (g) => g.referral),
  entry('Referral-Landing', 'Referral landing: what the invited friend sees', ReferralLanding, referralLanding),
  brandEntry('Badge-Embed', 'Check-it badge: preview, style and embed code', BadgeEmbed, (g) => g.badge),
  entry('Verify-Badge-Landing', 'Verify from a badge, with "Make yours on JamJam"', VerifyBadgeLanding, verifyBadgeLanding, { empty: verifyBadgeLandingEmpty }),
  entry('Tip-Sheet', 'Tip the creator of a verified post in USDC', TipSheet, tipSheet, { empty: tipSheetNoWallet }),
  brandEntry('Tips-Received', 'Tips received', TipsReceived, (g) => g.tips),
  brandEntry('Invite-Team', 'Invite a teammate or partner: seats and roles', InviteTeam, (g) => g.team),
  entry('Invite-Accept', 'Accept an invite', InviteAccept, inviteAccept, { empty: inviteAcceptEmpty }),
  // Loop screens (ADR-012, canvas v21): titles are the canvas board titles without the tag.
  brandEntry('Grow-Home', 'Grow › overview: every way aDNA’s reach grows', GrowHome, (g) => g.growHome),
  brandEntry('Distribute-Adapt', 'Distribute › write once, adapt per platform, schedule', DistributeAdapt, (g) => g.adapt),
  brandEntry('Events', 'Grow › events: from Luma or by hand, each with a content plan', Events, (g) => g.events),
  brandEntry('Event-Detail', 'Grow › one event: plan, people, results', EventDetail, (g) => g.eventDetail),
  entry('Events-Board', 'Public › events board: rated by people who went', EventsBoard, eventsBoard, { empty: eventsBoardEmpty }, 'ROADMAP'),
  entry('Event-Rating', 'Public › one event’s ratings, and rate it', EventRating, eventRating, { empty: eventRatingEmpty }, 'ROADMAP'),
  brandEntry('Quests', 'Grow › quests: paid community tasks in USDC', Quests, (g) => g.quests),
];
