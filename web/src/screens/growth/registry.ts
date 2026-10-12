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
import { referral, referralEmpty, referralLanding } from './referral.fixtures';
import { badgeEmbed, badgeEmbedEmpty, verifyBadgeLanding, verifyBadgeLandingEmpty } from './badge.fixtures';
import { tipSheet, tipSheetNoWallet, tipsReceived, tipsReceivedEmpty } from './tips.fixtures';
import { inviteAccept, inviteAcceptEmpty, team, teamEmpty } from './team.fixtures';
import { GrowHome } from './Grow-Home';
import { DistributeAdapt } from './Distribute-Adapt';
import { Events } from './Events';
import { EventDetail } from './Event-Detail';
import { EventsBoard } from './Events-Board';
import { EventRating } from './Event-Rating';
import { growHome, growHomeFirstRun } from './growHome.fixtures';
import { adapt, adaptNoneChosen } from './adapt.fixtures';
import { eventDetail, eventDetailCancelled, eventDetailPlanEmpty, events, eventsEmpty } from './events.fixtures';
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

export const screens: ScreenEntry[] = [
  entry('Platforms', 'Platforms: every place a brand can post, by kind', Platforms, platformsCatalog),
  entry('Platform-Detail', 'Platform: plans, posting rules, connect', PlatformDetail, platformDetail),
  entry('Referral', 'Refer a friend: link, offer and referrals', Referral, referral, { empty: referralEmpty }),
  entry('Referral-Landing', 'Referral landing: what the invited friend sees', ReferralLanding, referralLanding),
  entry('Badge-Embed', 'Check-it badge: preview, style and embed code', BadgeEmbed, badgeEmbed, { empty: badgeEmbedEmpty }),
  entry('Verify-Badge-Landing', 'Verify from a badge, with "Make yours on JamJam"', VerifyBadgeLanding, verifyBadgeLanding, { empty: verifyBadgeLandingEmpty }),
  entry('Tip-Sheet', 'Tip the creator of a verified post in USDC', TipSheet, tipSheet, { empty: tipSheetNoWallet }),
  entry('Tips-Received', 'Tips received', TipsReceived, tipsReceived, { empty: tipsReceivedEmpty }),
  entry('Invite-Team', 'Invite a teammate or partner: seats and roles', InviteTeam, team, { empty: teamEmpty }),
  entry('Invite-Accept', 'Accept an invite', InviteAccept, inviteAccept, { empty: inviteAcceptEmpty }),
  // Loop screens (ADR-012, canvas v21): titles are the canvas board titles without the tag.
  entry('Grow-Home', 'Grow › overview: every way aDNA’s reach grows', GrowHome, growHome, { empty: growHomeFirstRun }),
  entry('Distribute-Adapt', 'Distribute › write once, adapt per platform, schedule', DistributeAdapt, adapt, { empty: adaptNoneChosen }),
  entry('Events', 'Grow › events: from Luma or by hand, each with a content plan', Events, events, { empty: eventsEmpty }),
  entry('Event-Detail', 'Grow › one event: plan, people, results', EventDetail, eventDetail, { empty: eventDetailPlanEmpty, error: eventDetailCancelled }),
  entry('Events-Board', 'Public › events board: rated by people who went', EventsBoard, eventsBoard, { empty: eventsBoardEmpty }, 'ROADMAP'),
  entry('Event-Rating', 'Public › one event’s ratings, and rate it', EventRating, eventRating, { empty: eventRatingEmpty }, 'ROADMAP'),
];
