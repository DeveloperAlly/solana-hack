import { createElement } from 'react';
import type { ScreenEntry } from '../registry-types';
import { screenStates } from '../../ui/composites/DemoStateSwitcher';
import { Brain } from './Brain';
import { LearnRules } from './LearnRules';
import { MToday } from './MToday';
import { PostDetail } from './PostDetail';
import { Today } from './Today';
import { VerifyHome } from './VerifyHome';
import { brainFirstRun, brainScreen, learnRules, learnRulesCollecting, postDetail, postDetailEmpty, today, todayAllClear, verifyHome, verifyHomeEmpty } from './fixtures';

// The loop boards (ADR-012, PR #86): canvas v24 pages "Start here: the loop", "4 · Verify anywhere" and "6 · Learn
// from what works". Titles and tags are the canvas board titles (canvas.json). Each screen's home comes from its page
// (config/nav.ts); its shell from the frame it renders (LoopPage, L1 AppShell: app). The empty state swaps in the
// empty fixture; every other state uses the full one.
const pick = <T,>(full: T, empty: T) => (s: string) => (s === 'empty' ? empty : full);

const todayData = pick(today, todayAllClear);
const postData = pick(postDetail, postDetailEmpty);
const brainData = pick(brainScreen, brainFirstRun);
const learnData = pick(learnRules, learnRulesCollecting);
const verifyData = pick(verifyHome, verifyHomeEmpty);

export const screens: ScreenEntry[] = [
  { artboard: 'Today', page: 'loop', title: 'Today: the front door (replaces Hub-Home)', tag: 'COMING SOON', states: screenStates, render: (state) => createElement(Today, { data: todayData(state), state }) },
  { artboard: 'M-Today', page: 'loop', title: 'Mobile: Today, one-tap approvals', tag: 'COMING SOON', states: screenStates, render: (state) => createElement(MToday, { data: todayData(state), state }) },
  { artboard: 'Post-Detail', page: 'loop', title: 'One post through the whole loop (PostLifecycle + Why this?)', tag: 'COMING SOON', states: screenStates, render: (state) => createElement(PostDetail, { data: postData(state), state }) },
  { artboard: 'Brain', page: 'loop', title: 'Brand › the Brain: one intelligence system, owner-approved', tag: 'COMING SOON', states: screenStates, render: (state) => createElement(Brain, { data: brainData(state), state }) },
  { artboard: 'Learn-Rules', page: 'learn', title: 'Learn › suggested rules: results become Brain changes you approve', tag: 'COMING SOON', states: screenStates, render: (state) => createElement(LearnRules, { data: learnData(state), state }) },
  { artboard: 'Verify-Home', page: 'public', title: "Verify › your proof: what's registered and who checked", tag: 'COMING SOON', states: screenStates, render: (state) => createElement(VerifyHome, { data: verifyData(state), state }) },
];
