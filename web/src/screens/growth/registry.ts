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
import type { ScreenProps } from './types';

// Growth screens (issue #82): distribution screens the pitch deck promises. Canvas v22 now draws them on the Distribute,
// Verify and Grow pages, so each entry's page is its board's page (config/artboards.ts) and its home follows from that
// (config/nav.ts). Nothing is built behind them, so every screen is COMING SOON.
// The ambassador "both" model and the canvas boards are separate sub-tasks of issue #82.

/** Canvas has no empty view for these: a catalog, a detail page or an invite link always has content. */
const noEmpty: readonly ScreenState[] = ['success', 'loading', 'error'];

function entry<D>(
  artboard: ScreenEntry['artboard'],
  title: string,
  screen: FunctionComponent<ScreenProps<D>>,
  data: D,
  empty?: D,
): ScreenEntry {
  return {
    artboard,
    page: artboardPages[artboard],
    title,
    tag: 'COMING SOON',
    states: empty === undefined ? noEmpty : screenStates,
    render: (state) => createElement(screen, { data: state === 'empty' && empty !== undefined ? empty : data, state }),
  };
}

export const screens: ScreenEntry[] = [
  entry('Platforms', 'Platforms: every place a brand can post, by kind', Platforms, platformsCatalog),
  entry('Platform-Detail', 'Platform: plans, posting rules, connect', PlatformDetail, platformDetail),
  entry('Referral', 'Refer a friend: link, offer and referrals', Referral, referral, referralEmpty),
  entry('Referral-Landing', 'Referral landing: what the invited friend sees', ReferralLanding, referralLanding),
  entry('Badge-Embed', 'Check-it badge: preview, style and embed code', BadgeEmbed, badgeEmbed, badgeEmbedEmpty),
  entry('Verify-Badge-Landing', 'Verify from a badge, with "Make yours on JamJam"', VerifyBadgeLanding, verifyBadgeLanding, verifyBadgeLandingEmpty),
  entry('Tip-Sheet', 'Tip the creator of a verified post in USDC', TipSheet, tipSheet, tipSheetNoWallet),
  entry('Tips-Received', 'Tips received', TipsReceived, tipsReceived, tipsReceivedEmpty),
  entry('Invite-Team', 'Invite a teammate or partner: seats and roles', InviteTeam, team, teamEmpty),
  entry('Invite-Accept', 'Accept an invite', InviteAccept, inviteAccept, inviteAcceptEmpty),
];
