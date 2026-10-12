import { createElement, type ReactElement } from 'react';
import type { ScreenEntry } from '../registry-types';
import type { ArtboardName } from '../../config/artboards';
import { screenStates, type ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { Brain } from './Brain';
import { LearnRules } from './LearnRules';
import { MToday } from './MToday';
import { PostDetail } from './PostDetail';
import { Today } from './Today';
import { VerifyHome } from './VerifyHome';
import { ActiveBrandLoop } from './ActiveBrandLoop';
import { brainRules } from '../../domain/brain';
import type { LoopBrandData } from './fixtures';
import type { LearnRulesData, PostDetailData, TodayData, VerifyHomeData } from './types';
import type { LoopBase } from '../../flows/loop/useLoop';

// The loop boards (ADR-012, PR #86): canvas v24 pages "Start here: the loop", "4 · Verify anywhere" and "6 · Learn
// from what works". Titles and tags are the canvas board titles (canvas.json). Each screen's home comes from its page
// (config/nav.ts); its shell from the frame it renders (LoopFrame, L1 AppShell: app). Data comes from the one active
// brand (ActiveBrandLoop), and the state from that data (resolveState), never hard-coded.

/**
 * The state a screen shows: the demo state asked for, except that "success" on data with nothing in it is the empty
 * state, so a first-run brand never sees a success layout with zero data (Codex review on PR 111). Loading and error
 * are shown as asked.
 */
export const resolveState = (requested: ScreenState, isEmpty: boolean): ScreenState => (requested === 'success' && isEmpty ? 'empty' : requested);

/** One loop screen: which of the brand's data sets it shows for full and empty, what "empty" means, and how it renders. */
interface LoopScreen<D> {
  full: (d: LoopBrandData) => D;
  empty: (d: LoopBrandData) => D;
  isEmpty: (data: D) => boolean;
  render: (data: D, state: ScreenState) => ReactElement;
}

function loopEntry<D>(artboard: ArtboardName, page: ScreenEntry['page'], title: string, s: LoopScreen<D>): ScreenEntry {
  return {
    artboard,
    page,
    title,
    tag: 'COMING SOON',
    states: screenStates,
    render: (state) => createElement(ActiveBrandLoop, {
      artboard,
      view: (d: LoopBrandData) => {
        const data = state === 'empty' ? s.empty(d) : s.full(d);
        return s.render(data, resolveState(state, s.isEmpty(data)));
      },
    }),
  };
}

const todayScreen = (Screen: typeof Today | typeof MToday): LoopScreen<TodayData> => ({
  full: (d) => d.today,
  empty: (d) => d.todayAllClear,
  isEmpty: (data) => data.queue.length === 0,
  render: (data, state) => createElement(Screen, { data, state }),
});

export const screens: ScreenEntry[] = [
  loopEntry('Today', 'loop', 'Today: the front door (replaces Hub-Home)', todayScreen(Today)),
  loopEntry('M-Today', 'loop', 'Mobile: Today, one-tap approvals', todayScreen(MToday)),
  loopEntry<PostDetailData>('Post-Detail', 'loop', 'One post through the whole loop (PostLifecycle + Why this?)', {
    full: (d) => d.postDetail, empty: (d) => d.postDetailEmpty, isEmpty: (data) => data.posts.length === 0,
    render: (data, state) => createElement(PostDetail, { data, state }),
  }),
  loopEntry<LoopBase>('Brain', 'loop', 'Brand › the Brain: one intelligence system, owner-approved', {
    full: (d) => d.brain, empty: (d) => d.brainFirstRun, isEmpty: (data) => brainRules(data.brain).learned.length === 0,
    render: (data, state) => createElement(Brain, { data, state }),
  }),
  loopEntry<LearnRulesData>('Learn-Rules', 'learn', 'Learn › suggested rules: results become Brain changes you approve', {
    full: (d) => d.learnRules, empty: (d) => d.learnRulesCollecting, isEmpty: (data) => data.proposals.length === 0,
    render: (data, state) => createElement(LearnRules, { data, state }),
  }),
  loopEntry<VerifyHomeData>('Verify-Home', 'public', "Verify › your proof: what's registered and who checked", {
    full: (d) => d.verifyHome, empty: (d) => d.verifyHomeEmpty, isEmpty: (data) => data.registered.length === 0,
    render: (data, state) => createElement(VerifyHome, { data, state }),
  }),
];
