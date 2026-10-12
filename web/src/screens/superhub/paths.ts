import { useMemo } from 'react';
import { useScreenHref } from '../../gallery/screenPath';
import type { ArtboardName } from '../../config/artboards';

/**
 * Every screen the Superhub screens link to, in one map: link key → canvas artboard (issue #52). Screens and fixtures
 * name a key, never a path; `useHubLinks` turns the keys into hrefs through the gallery's `useScreenHref`, which keeps
 * the gallery theme (web/src/screens/README.md). Artboards on other pages resolve once their page PRs merge.
 */
export const artboards = {
  // This page (canvas "Superhub (v2)")
  home: 'Hub-Home',
  inboxAll: 'Inbox-All',
  inboxNeedsReply: 'Inbox-NeedsReply',
  inboxConnect: 'Inbox-Connect',
  brandBuild: 'Brand-Build',
  voiceTemplates: 'Voice-Templates',
  voiceEditor: 'Voice-Editor',
  content: 'Content-Dashboard',
  contentEmpty: 'Content-Dashboard-Empty',
  campaignGoal: 'Campaign-v2-1-Goal',
  campaignMeasure: 'Campaign-v2-2-Measure',
  engageQueue: 'Engage-Queue',
  engageRules: 'Engage-Rules',
  partners: 'Partners',
  leads: 'Leads',
  influencerSetup: 'Influencer-Setup',
  influencerQueue: 'Influencer-Queue',
  analytics: 'Analytics',
  analyticsEmpty: 'Analytics-Empty',
  // Other pages
  main: 'Main',
  ledger: 'Ledger',
  claims: 'Claims',
  verification: 'Onboard-2-Domain',
  profiling: 'Onboard-3b-Profiling',
  ingestError: 'Ingest-Error',
  kitExport: 'Kit-Export',
  kitPublished: 'Onboard-6-Published',
  ambassadors: 'Dashboard',
  verifyMatch: 'Verify-1-Match',
  campaignAudience: 'Campaign-v2-3-Audience',
  campaignPlan: 'Campaign-v2-4-Plan',
  campaignBudget: 'Campaign-v2-5-Budget',
  campaignLaunch: 'Campaign-v2-6-Launch',
} as const satisfies Record<string, ArtboardName>;

/**
 * The Draft-Review boards. They are not link keys: Draft-Review has no default draft, so the only way in is
 * useOpenDraft(draftId, board), which always names the draft (Codex review on PR #81).
 */
export const draftBoards = {
  review: 'Draft-Review',
  beautified: 'Draft-Review-Beautified',
  polishError: 'Draft-Review-PolishError',
} as const satisfies Record<string, ArtboardName>;
export type DraftBoard = keyof typeof draftBoards;

/** A link key: an artboard above, or the calendar anchor on the content dashboard. */
export type HubLink = keyof typeof artboards | 'contentCalendar';

/** Hrefs for every link key, keeping the current gallery theme. */
export function useHubLinks(): Record<HubLink, string> {
  const href = useScreenHref();
  return useMemo(() => {
    const links = Object.fromEntries(Object.entries(artboards).map(([key, artboard]) => [key, href(artboard)])) as Record<keyof typeof artboards, string>;
    return { ...links, contentCalendar: `${links.content}#calendar` };
  }, [href]);
}
