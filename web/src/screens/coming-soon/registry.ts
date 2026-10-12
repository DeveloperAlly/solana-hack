import { createElement } from 'react';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import type { ScreenEntry } from '../registry-types';
import type { ArtboardName } from '../../config/artboards';
import { SettingsAI } from './Settings-AI';
import { SettingsGetKey } from './Settings-GetKey';
import { SettingsConnections } from './Settings-Connections';
import { SettingsPlan } from './Settings-Plan';
import { Pricing } from './Pricing';
import { Upgrade } from './Upgrade';
import { MediaComposer } from './Media-Composer';
import { MediaReview } from './Media-Review';
import { CampaignAudience } from './Campaign-v2-3-Audience';
import { CampaignPlan } from './Campaign-v2-4-Plan';
import { CampaignBudget } from './Campaign-v2-5-Budget';
import { CampaignLaunch } from './Campaign-v2-6-Launch';
import { PublishCalendar } from './Publish-Calendar';
import { Claims } from './Claims';
import { BrandSwitcherScreen } from './Brand-Switcher';
import { FounderProfile } from './Founder-Profile';
import { OutcomeLog } from './Outcome-Log';
import { settingsAI, settingsAINoKey } from './Settings-AI.fixtures';
import { settingsGetKey } from './Settings-GetKey.fixtures';
import { settingsConnections, settingsConnectionsEmpty } from './Settings-Connections.fixtures';
import { settingsPlan, settingsPlanNoInvoices } from './Settings-Plan.fixtures';
import { pricing } from './Pricing.fixtures';
import { upgrade } from './Upgrade.fixtures';
import { mediaComposer } from './Media-Composer.fixtures';
import { mediaReview } from './Media-Review.fixtures';
import { campaignAudience, campaignAudienceEmpty } from './Campaign-v2-3-Audience.fixtures';
import { campaignPlan } from './Campaign-v2-4-Plan.fixtures';
import { campaignBudget, campaignBudgetOverBalance } from './Campaign-v2-5-Budget.fixtures';
import { campaignLaunch, campaignLaunchBlocked } from './Campaign-v2-6-Launch.fixtures';
import { publishCalendar, publishCalendarEmpty } from './Publish-Calendar.fixtures';
import { claims, claimsEmpty } from './Claims.fixtures';
import { brandSwitcher } from './Brand-Switcher.fixtures';
import { founderProfile, founderProfileEmpty } from './Founder-Profile.fixtures';
import { outcomeLog, outcomeLogEmpty } from './Outcome-Log.fixtures';

/** Fixture for a state: the state's own fixture when it has one, otherwise the default. */
const pick = <T,>(base: T, byState: Partial<Record<ScreenState, T>> = {}) => (state: ScreenState) => byState[state] ?? base;

/** One entry per artboard. The gallery re-mounts the screen when the demo state changes (GalleryScreen, PR #83). */
function entry<T>(artboard: ArtboardName, title: string, states: readonly ScreenState[], Screen: (p: { data: T; state?: ScreenState }) => ReturnType<typeof createElement>, data: (s: ScreenState) => T): ScreenEntry {
  return { artboard, page: 'soon', title, tag: 'COMING SOON', states, render: (state) => createElement(Screen, { data: data(state), state }) };
}

// Canvas page "Coming soon (drawn, not built)", issue #51. Titles are the canvas board titles without the tag prefix.
// The two Verify boards on this canvas page are built in issue #49.
export const screens: ScreenEntry[] = [
  entry('Settings-AI', 'Settings › AI model and your key', ['success', 'empty', 'loading', 'error'], SettingsAI, pick(settingsAI, { empty: settingsAINoKey })),
  entry('Settings-GetKey', 'Get a key (OpenRouter connect or paste)', ['success', 'loading', 'error'], SettingsGetKey, pick(settingsGetKey)),
  entry('Settings-Connections', 'Settings › connections and payout wallet', ['success', 'empty', 'loading'], SettingsConnections, pick(settingsConnections, { empty: settingsConnectionsEmpty })),
  entry('Settings-Plan', 'Settings › plan, seats, invoices', ['success', 'empty', 'loading', 'error'], SettingsPlan, pick(settingsPlan, { empty: settingsPlanNoInvoices })),
  entry('Pricing', 'Pricing (public)', ['success'], Pricing, pick(pricing)),
  entry('Upgrade', 'Upgrade: one page to paid', ['success', 'loading', 'error'], Upgrade, pick(upgrade)),
  entry('Media-Composer', 'Media composer: carousel, card, video', ['success', 'empty', 'loading', 'error'], MediaComposer, pick(mediaComposer)),
  entry('Media-Review', 'Media review: checks on every slide', ['success', 'loading', 'error'], MediaReview, pick(mediaReview)),
  entry('Campaign-v2-3-Audience', 'Campaign v2 step 2: audience', ['success', 'empty'], CampaignAudience, pick(campaignAudience, { empty: campaignAudienceEmpty })),
  entry('Campaign-v2-4-Plan', 'Campaign v2 step 4: content plan', ['success', 'loading', 'error'], CampaignPlan, pick(campaignPlan)),
  entry('Campaign-v2-5-Budget', 'Campaign v2 step 5: people and budget (no paid X)', ['success', 'error'], CampaignBudget, pick(campaignBudget, { error: campaignBudgetOverBalance })),
  entry('Campaign-v2-6-Launch', 'Campaign v2 step 6: review and launch', ['success', 'error'], CampaignLaunch, pick(campaignLaunch, { error: campaignLaunchBlocked })),
  entry('Publish-Calendar', 'Publishing: schedule + failed-publish alert', ['success', 'empty', 'loading'], PublishCalendar, pick(publishCalendar, { empty: publishCalendarEmpty })),
  entry('Claims', 'Claims table: evidence, owner, expiry', ['success', 'empty', 'loading', 'error'], Claims, pick(claims, { empty: claimsEmpty })),
  entry('Brand-Switcher', 'Switch or add a brand', ['success', 'loading'], BrandSwitcherScreen, pick(brandSwitcher)),
  entry('Founder-Profile', 'Linked founder profile', ['success', 'empty'], FounderProfile, pick(founderProfile, { empty: founderProfileEmpty })),
  entry('Outcome-Log', 'Outcome log: inbound qualified against the audience', ['success', 'empty', 'loading', 'error'], OutcomeLog, pick(outcomeLog, { empty: outcomeLogEmpty })),
];
