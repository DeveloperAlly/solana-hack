/*
 * Every screen the Journey screens link to, in one map (issue #48): a key per target and the canvas board it opens
 * (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn). Hrefs are built only by the gallery's typed screenPath /
 * useScreenHref (web/src/gallery/screenPath.ts, ArtboardName from config/artboards.ts), which keep the gallery theme.
 */
import { createContext, useContext, useCallback } from 'react';
import { useScreenHref } from '../../gallery/screenPath';
import type { ArtboardName } from '../../config/artboards';
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
  ledger: 'Ledger',
  basics: 'BB-1-Basics',
  brandBuild: 'Brand-Build',
  contentDashboard: 'Content-Dashboard',
  settingsAi: 'Settings-AI',
  partners: 'Partners',
} as const satisfies Record<string, ArtboardName>;

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

export const JourneyHrefContext = createContext<((target: JourneyTarget) => string) | null>(null);

/** (target, state?) => href for a Journey target. Every Journey link goes through it; it keeps the gallery theme. */
export function useJourneyHref(): (target: JourneyTarget, state?: ScreenState) => string {
  const href = useScreenHref();
  const liveHref = useContext(JourneyHrefContext);
  return useCallback((target: JourneyTarget, state?: ScreenState) => liveHref ? liveHref(target) : href(journeyBoards[target], state), [href, liveHref]);
}

/** Live nav paths (config/routes.ts) mapped to registered Journey boards, for the shells' navHref; others stay live. */
const navTargets: Record<string, JourneyTarget> = { '/': 'main', '/home': 'hub', '/verify': 'proof', '/ledger': 'ledger' };
export function useNavHref(): (path: string) => string {
  const to = useJourneyHref();
  const live = useContext(JourneyHrefContext);
  return useCallback((path: string) => (live && path === '/verify' ? '/verify' : navTargets[path] ? to(navTargets[path]) : path), [to, live]);
}
