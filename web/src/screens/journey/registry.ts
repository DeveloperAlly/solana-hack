/*
 * Canvas page "Journey (v3): first run" (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), built in issue #48.
 * Titles are the board titles without the "JOURNEY ·" tag; JOURNEY boards are HACKATHON (config/routes.ts). States are
 * the ones each board draws or its note names. Journey-Map is a diagram, not a screen, so it is not registered.
 * The screens link to each other through ./paths, so Main and J1 to J8 click through as one route.
 */
import { createElement } from 'react';
import type { ScreenEntry } from '../registry-types';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';
import { Main } from './Main';
import { J1Read } from './J1-Read';
import { J2Save } from './J2-Save';
import { J3Confirm } from './J3-Confirm';
import { J4GapsVoice } from './J4-Gaps-Voice';
import { J5ApproveKit } from './J5-Approve-Kit';
import { J6FirstPost } from './J6-First-Post';
import { J7Proof } from './J7-Proof';
import { J8HubFirstRun } from './J8-Hub-FirstRun';
import { mainFixture, mainFixtureInvalidUrl, mainFixtureNoExample } from './Main.fixtures';
import { readFixture, readFixtureBlocked, readFixtureEmpty, readFixtureLoading } from './J1-Read.fixtures';
import { saveFixture, saveFixtureExpired } from './J2-Save.fixtures';
import { confirmFixture } from './J3-Confirm.fixtures';
import { gapsVoiceFixture } from './J4-Gaps-Voice.fixtures';
import { approveKitFixture, approveKitFixtureFailed } from './J5-Approve-Kit.fixtures';
import { firstPostFixture } from './J6-First-Post.fixtures';
import { proofFixture } from './J7-Proof.fixtures';
import { hubFirstRunFixture } from './J8-Hub-FirstRun.fixtures';

const success = ['success'] as const satisfies readonly ScreenState[];

// Each render keys on the state, so switching state remounts the screen with that state's fixture.
export const screens: ScreenEntry[] = [
  {
    artboard: 'Main',
    page: 'journey',
    title: '0 Land: outcome, real example, URL in',
    tag: 'HACKATHON',
    states: ['success', 'empty', 'error'],
    render: (state) => createElement(Main, { key: state, state, data: { success: mainFixture, empty: mainFixtureNoExample, error: mainFixtureInvalidUrl, loading: mainFixture }[state] }),
  },
  {
    artboard: 'J1-Read',
    page: 'journey',
    title: '1 Read: facts with quotes (AHA 1)',
    tag: 'HACKATHON',
    states: ['success', 'loading', 'error', 'empty'],
    render: (state) => createElement(J1Read, { key: state, state, data: { success: readFixture, loading: readFixtureLoading, error: readFixtureBlocked, empty: readFixtureEmpty }[state] }),
  },
  {
    artboard: 'J2-Save',
    page: 'journey',
    title: '2 Save: email after value (proposed D1)',
    tag: 'HACKATHON',
    states: ['success', 'loading', 'error'],
    render: (state) => createElement(J2Save, { key: state, state, data: state === 'error' ? saveFixtureExpired : saveFixture }),
  },
  { artboard: 'J3-Confirm', page: 'journey', title: '3 Confirm: prefilled cards (AHA 2)', tag: 'HACKATHON', states: success, render: () => createElement(J3Confirm, { data: confirmFixture }) },
  { artboard: 'J4-Gaps-Voice', page: 'journey', title: '4 Gaps + voice by example (AHA 3)', tag: 'HACKATHON', states: success, render: () => createElement(J4GapsVoice, { data: gapsVoiceFixture }) },
  {
    artboard: 'J5-Approve-Kit',
    page: 'journey',
    title: '5 Approve kit v1: 3 gates',
    tag: 'HACKATHON',
    states: ['success', 'error'],
    render: (state) => createElement(J5ApproveKit, { key: state, state, data: state === 'error' ? approveKitFixtureFailed : approveKitFixture }),
  },
  { artboard: 'J6-First-Post', page: 'journey', title: '6 First post, claims backed (AHA 4)', tag: 'HACKATHON', states: success, render: () => createElement(J6FirstPost, { data: firstPostFixture }) },
  { artboard: 'J7-Proof', page: 'journey', title: '7 Prove: registered + Official (AHA 5)', tag: 'HACKATHON', states: success, render: () => createElement(J7Proof, { data: proofFixture }) },
  { artboard: 'J8-Hub-FirstRun', page: 'journey', title: '8 Return: first-run hub + checklist', tag: 'HACKATHON', states: success, render: () => createElement(J8HubFirstRun, { data: hubFirstRunFixture }) },
];
