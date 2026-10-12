// Every non-archived artboard on the wireframe canvas, generated from its canvas.json (version 1791808618-e7ab,
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn; issue #46). The Archive page ("licensee") is not built (issue #45).
// Links between screens take an ArtboardName (screenPath, useScreenHref, ScreenLink), so a misspelled or missing
// board fails typecheck (Codex review on PR #80). Regenerate when the canvas adds or renames a board.
import type { CanvasPageId } from '../screens/registry-types';

export const artboardPages = {
  'Amb-1-Campaigns': 'ambassador',
  'Amb-1b-CampaignsEmpty': 'ambassador',
  'Amb-2-Detail': 'ambassador',
  'Amb-3-Generate': 'ambassador',
  'Amb-4-Publish': 'ambassador',
  'Amb-5a-Verifying': 'ambassador',
  'Amb-5b-Paid': 'ambassador',
  'Amb-5c-VerifyFailed': 'ambassador',
  'Amb-5d-BudgetReached': 'ambassador',
  'Analytics': 'hub',
  'Analytics-Empty': 'hub',
  'BB-1-Basics': 'brand',
  'BB-2-Origin': 'brand',
  'BB-3-GoldenCircle': 'brand',
  'BB-4-Alternatives': 'brand',
  'BB-5-Audience': 'brand',
  'BB-6-Voice': 'brand',
  'BB-Gate1-Purpose': 'brand',
  'BB-Gate2-Positioning': 'brand',
  'BB-Gate3-Voice': 'brand',
  'Brand-Build': 'hub',
  'Brand-Switcher': 'soon',
  'Campaign-v2-1-Goal': 'hub',
  'Campaign-v2-2-Measure': 'hub',
  'Campaign-v2-3-Audience': 'soon',
  'Campaign-v2-4-Plan': 'soon',
  'Campaign-v2-5-Budget': 'soon',
  'Campaign-v2-6-Launch': 'soon',
  'Claims': 'soon',
  'Content-Dashboard': 'hub',
  'Content-Dashboard-Empty': 'hub',
  'Coverage-Map': 'brand',
  'Dashboard': 'brand',
  'Dashboard-Empty': 'brand',
  'Draft-Review': 'hub',
  'Draft-Review-Beautified': 'hub',
  'Draft-Review-PolishError': 'hub',
  'Engage-Queue': 'hub',
  'Engage-Rules': 'hub',
  'Founder-Profile': 'soon',
  'Hub-Home': 'hub',
  'Inbox-All': 'hub',
  'Inbox-Connect': 'hub',
  'Inbox-NeedsReply': 'hub',
  'Influencer-Queue': 'hub',
  'Influencer-Setup': 'hub',
  'Ingest-Error': 'brand',
  'J1-Read': 'journey',
  'J2-Save': 'journey',
  'J3-Confirm': 'journey',
  'J4-Gaps-Voice': 'journey',
  'J5-Approve-Kit': 'journey',
  'J6-First-Post': 'journey',
  'J7-Proof': 'journey',
  'J8-Hub-FirstRun': 'journey',
  'Journey-Map': 'journey',
  'Kit-Export': 'brand',
  'Kit-RegisterFailed': 'brand',
  'Leads': 'hub',
  'Ledger': 'public',
  'M-1-Campaigns': 'ambassador',
  'M-2-Detail': 'ambassador',
  'M-3-Generate': 'ambassador',
  'M-4-Publish': 'ambassador',
  'M-5-Status': 'ambassador',
  'Main': 'journey',
  'Media-Composer': 'soon',
  'Media-Review': 'soon',
  'Onboard-1-SignIn': 'brand',
  'Onboard-2-Domain': 'brand',
  'Onboard-2b-DomainFailed': 'brand',
  'Onboard-3-Sources': 'brand',
  'Onboard-3b-Profiling': 'brand',
  'Onboard-6-Published': 'brand',
  'Outcome-Log': 'soon',
  'Partners': 'hub',
  'Pricing': 'soon',
  'Publish-Calendar': 'soon',
  'Settings-AI': 'soon',
  'Settings-Connections': 'soon',
  'Settings-GetKey': 'soon',
  'Settings-Plan': 'soon',
  'Upgrade': 'soon',
  'Verify-1-Match': 'public',
  'Verify-2-NoMatch': 'public',
  'Verify-3-Edited': 'public',
  'Verify-4-Kit-Account-Claim': 'soon',
  'Verify-5-Retracted': 'soon',
  'Voice-Editor': 'hub',
  'Voice-Templates': 'hub',
} as const satisfies Record<string, CanvasPageId>;

/**
 * PENDING CANVAS: hand-written, not generated. Screens built before their canvas board exists (issue #82, sub-task
 * "Canvas": the boards are added to the canvas so it follows the product, AGENTS rule 8). Each name moves into
 * artboardPages above when the canvas gains the board and this file is regenerated; then this list shrinks to empty.
 */
export const pendingCanvasArtboards = {
  'Platforms': 'growth',
  'Platform-Detail': 'growth',
  'Referral': 'growth',
  'Referral-Landing': 'growth',
  'Badge-Embed': 'growth',
  'Verify-Badge-Landing': 'growth',
  'Tip-Sheet': 'growth',
  'Tips-Received': 'growth',
  'Invite-Team': 'growth',
  'Invite-Accept': 'growth',
} as const satisfies Record<string, CanvasPageId>;

export type ArtboardName = keyof typeof artboardPages | keyof typeof pendingCanvasArtboards;

/** Canvas boards, then the pending-canvas boards, each in name order. */
export const artboards = [...Object.keys(artboardPages), ...Object.keys(pendingCanvasArtboards)] as ArtboardName[];

export function isArtboardName(name: string): name is ArtboardName {
  const has = (o: object) => Object.prototype.hasOwnProperty.call(o, name);
  return has(artboardPages) || has(pendingCanvasArtboards);
}
