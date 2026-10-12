/*
 * Every screen the Journey screens link to, in one map (issue #48): a key per target and the canvas board it opens
 * (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn). Hrefs are built only by the gallery's typed screenPath /
 * useScreenHref (web/src/gallery/screenPath.ts, ArtboardName from config/artboards.ts), which keep the gallery theme.
 */
import { useCallback } from 'react';
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
  draftReview: 'Draft-Review',
  settingsAi: 'Settings-AI',
  partners: 'Partners',
} as const satisfies Record<string, ArtboardName>;

export type JourneyTarget = keyof typeof journeyBoards;

/**
 * Boards whose pages have not merged yet. A gallery link may only target a registered board
 * (src/gallery/links.test.tsx, merge order), so until each page lands its link goes to the live route that does the
 * same job (config/routes.ts), or to nothing. Delete an entry when its page merges; the link then opens the board.
 */
const pending: Partial<Record<JourneyTarget, string | null>> = {
  basics: '/build', // Brand Builder (#50)
  brandBuild: '/brand', // Brand Builder (#50)
  contentDashboard: '/create', // Superhub (#52)
  draftReview: '/create', // Superhub (#52)
  settingsAi: '/settings', // Superhub (#52)
  partners: null, // Superhub (#52); no live route
};

/** Targets that always have a link (every one but those pending with no live route). */
export type LinkedTarget = Exclude<JourneyTarget, 'partners'>;

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

/** href for a target, or undefined while its page is pending with no live route. Keeps the gallery theme. */
export function useJourneyLink(): (target: JourneyTarget, state?: ScreenState) => string | undefined {
  const href = useScreenHref();
  return useCallback(
    (target: JourneyTarget, state?: ScreenState) => (target in pending ? pending[target] ?? undefined : href(journeyBoards[target], state)),
    [href],
  );
}

/** (target, state?) => href for a target that always has a link. Every Journey link goes through it. */
export function useJourneyHref(): (target: LinkedTarget, state?: ScreenState) => string {
  const link = useJourneyLink();
  return useCallback((target: LinkedTarget, state?: ScreenState) => link(target, state) as string, [link]);
}

/** Live nav paths (config/routes.ts) mapped to registered Journey boards, for the shells' navHref; others stay live. */
const navTargets: Record<string, JourneyTarget> = { '/': 'main', '/home': 'hub', '/verify': 'proof', '/ledger': 'ledger' };
export function useNavHref(): (path: string) => string {
  const to = useJourneyHref();
  return useCallback((path: string) => (navTargets[path] ? to(navTargets[path] as LinkedTarget) : path), [to]);
}
