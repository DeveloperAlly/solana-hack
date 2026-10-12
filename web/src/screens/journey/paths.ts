/*
 * Every screen the Journey screens link to, in one map (issue #48): a key per target and the canvas board it opens
 * (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn). Hrefs are built only by the gallery's screenPath/useScreenHref
 * (web/src/gallery/screenPath.ts), which keeps the gallery theme. Boards other pages build (Ledger, BB-1-Basics and so
 * on) open once those pages land; until then the gallery says "No such screen".
 */
import { useCallback } from 'react';
import { useScreenHref } from '../../gallery/screenPath';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';

export const journeyBoards = {
  main: 'Main',
  read: 'J1-Read',
  save: 'J2-Save',
  confirm: 'J3-Confirm',
  gapsVoice: 'J4-Gaps-Voice',
  approveKit: 'J5-Approve-Kit',
  firstPost: 'J6-First-Post',
  proof: 'J7-Proof',
  hub: 'J8-Hub-FirstRun',
  // Boards on other canvas pages that Journey links to.
  basics: 'BB-1-Basics',
  signIn: 'Onboard-1-SignIn',
  ledger: 'Ledger',
  brandBuild: 'Brand-Build',
  contentDashboard: 'Content-Dashboard',
  draftReview: 'Draft-Review',
  engageQueue: 'Engage-Queue',
  inbox: 'Inbox-All',
  analytics: 'Analytics',
  settingsAi: 'Settings-AI',
  partners: 'Partners',
} as const;

export type JourneyTarget = keyof typeof journeyBoards;

/**
 * The seven numbered steps of the first run, in order, with the time estimate and header status chip each canvas board
 * shows. The signed-in address is the canvas sample ("ally@…"); live, it is the session's email.
 */
export const journeySteps = [
  { id: 'read', label: 'Read', estimate: 'About 9 min left · target', status: 'Not signed in' },
  { id: 'save', label: 'Save', estimate: 'About 8 min left · target', status: 'Not signed in' },
  { id: 'confirm', label: 'Confirm', estimate: 'About 7 min left · target', status: 'ally@… signed in' },
  { id: 'gapsVoice', label: 'Gaps + voice', estimate: 'About 5 min left · target', status: 'ally@… signed in' },
  { id: 'approveKit', label: 'Approve kit', estimate: 'About 3 min left · target', status: 'ally@… signed in' },
  { id: 'firstPost', label: 'First post', estimate: 'About 2 min left · target', status: 'Kit v1 registered ✓' },
  { id: 'proof', label: 'Prove', estimate: 'Done · target under 10 min', status: 'Post registered ✓' },
] as const satisfies readonly { id: JourneyTarget; label: string; estimate: string; status: string }[];

export type JourneyStepId = (typeof journeySteps)[number]['id'];

/** Live public nav paths (config/routes.ts publicNav) mapped to the boards canvas Main links to. */
const publicTargets: Record<string, JourneyTarget> = { '/': 'main', '/verify': 'proof', '/ledger': 'ledger', '/sign-in': 'signIn', '/home': 'hub' };

/** Live hub nav paths (config/routes.ts hubNav) mapped to the boards canvas J8-Hub-FirstRun links to. */
const hubTargets: Record<string, JourneyTarget> = {
  '/home': 'hub',
  '/brand': 'brandBuild',
  '/create': 'contentDashboard',
  '/grow': 'engageQueue',
  '/inbox': 'inbox',
  '/analytics': 'analytics',
  '/ledger': 'ledger',
  '/settings': 'settingsAi',
};

/** (target, state?) => href that keeps the gallery theme. Every Journey link goes through it. */
export function useJourneyHref(): (target: JourneyTarget, state?: ScreenState) => string {
  const href = useScreenHref();
  return useCallback((target: JourneyTarget, state?: ScreenState) => href(journeyBoards[target], state), [href]);
}

/** Maps a shell's live nav path to its Journey board; paths with no board (How it works) stay as they are. */
function useNavHref(targets: Record<string, JourneyTarget>): (path: string) => string {
  const to = useJourneyHref();
  return useCallback((path: string) => (targets[path] ? to(targets[path]) : path), [to, targets]);
}
export const usePublicNavHref = () => useNavHref(publicTargets);
export const useHubNavHref = () => useNavHref(hubTargets);
