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
import type { LoopBrandData } from './fixtures';

// The loop boards (ADR-012, PR #86): canvas v24 pages "Start here: the loop", "4 · Verify anywhere" and "6 · Learn
// from what works". Titles and tags are the canvas board titles (canvas.json). Each screen's home comes from its page
// (config/nav.ts); its shell from the frame it renders (LoopFrame, L1 AppShell: app). Data comes from the one active
// brand (ActiveBrandLoop): the empty state shows the brand's empty variant; every other state its full data.
const forBrand = (artboard: ArtboardName, view: (d: LoopBrandData, state: ScreenState) => ReactElement) => (state: ScreenState) =>
  createElement(ActiveBrandLoop, { artboard, view: (d: LoopBrandData) => view(d, state) });
const empty = (s: ScreenState) => s === 'empty';

export const screens: ScreenEntry[] = [
  { artboard: 'Today', page: 'loop', title: 'Today: the front door (replaces Hub-Home)', tag: 'COMING SOON', states: screenStates, render: forBrand('Today', (d, state) => createElement(Today, { data: empty(state) ? d.todayAllClear : d.today, state })) },
  { artboard: 'M-Today', page: 'loop', title: 'Mobile: Today, one-tap approvals', tag: 'COMING SOON', states: screenStates, render: forBrand('M-Today', (d, state) => createElement(MToday, { data: empty(state) ? d.todayAllClear : d.today, state })) },
  { artboard: 'Post-Detail', page: 'loop', title: 'One post through the whole loop (PostLifecycle + Why this?)', tag: 'COMING SOON', states: screenStates, render: forBrand('Post-Detail', (d, state) => createElement(PostDetail, { data: empty(state) ? d.postDetailEmpty : d.postDetail, state })) },
  { artboard: 'Brain', page: 'loop', title: 'Brand › the Brain: one intelligence system, owner-approved', tag: 'COMING SOON', states: screenStates, render: forBrand('Brain', (d, state) => createElement(Brain, { data: empty(state) ? d.brainFirstRun : d.brain, state })) },
  { artboard: 'Learn-Rules', page: 'learn', title: 'Learn › suggested rules: results become Brain changes you approve', tag: 'COMING SOON', states: screenStates, render: forBrand('Learn-Rules', (d, state) => createElement(LearnRules, { data: empty(state) ? d.learnRulesCollecting : d.learnRules, state })) },
  { artboard: 'Verify-Home', page: 'public', title: "Verify › your proof: what's registered and who checked", tag: 'COMING SOON', states: screenStates, render: forBrand('Verify-Home', (d, state) => createElement(VerifyHome, { data: empty(state) ? d.verifyHomeEmpty : d.verifyHome, state })) },
];
