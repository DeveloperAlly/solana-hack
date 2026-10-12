import { createElement } from 'react';
import type { ScreenEntry } from '../registry-types';
import { BB1Basics } from './BB-1-Basics';
import { basicsData, basicsErrorData } from './BB-1-Basics.fixtures';
import { BB2Origin } from './BB-2-Origin';
import { originData } from './BB-2-Origin.fixtures';
import { BB3GoldenCircle } from './BB-3-GoldenCircle';
import { goldenCircleData } from './BB-3-GoldenCircle.fixtures';
import { BB4Alternatives } from './BB-4-Alternatives';
import { alternativesData } from './BB-4-Alternatives.fixtures';
import { BB5Audience } from './BB-5-Audience';
import { audienceData } from './BB-5-Audience.fixtures';
import { BB6Voice } from './BB-6-Voice';
import { voiceData } from './BB-6-Voice.fixtures';
import { BBGate1Purpose } from './BB-Gate1-Purpose';
import { gatePurposeData } from './BB-Gate1-Purpose.fixtures';
import { BBGate2Positioning } from './BB-Gate2-Positioning';
import { gatePositioningData } from './BB-Gate2-Positioning.fixtures';
import { BBGate3Voice } from './BB-Gate3-Voice';
import { gateVoiceData } from './BB-Gate3-Voice.fixtures';
import { CoverageMap } from './Coverage-Map';
import { coverageData } from './Coverage-Map.fixtures';
import { Dashboard } from './Dashboard';
import { dashboardData } from './Dashboard.fixtures';
import { dashboardEmptyData } from './Dashboard-Empty.fixtures';
import { ingestErrorData } from './Ingest-Error.fixtures';
import { KitExport } from './Kit-Export';
import { kitExportData } from './Kit-Export.fixtures';
import { registerFailedData } from './Kit-RegisterFailed.fixtures';
import { Onboard1SignIn } from './Onboard-1-SignIn';
import { signInData } from './Onboard-1-SignIn.fixtures';
import { Onboard2Domain } from './Onboard-2-Domain';
import { domainData } from './Onboard-2-Domain.fixtures';
import { domainFailedData } from './Onboard-2b-DomainFailed.fixtures';
import { Onboard3Sources } from './Onboard-3-Sources';
import { sourcesData } from './Onboard-3-Sources.fixtures';
import { Onboard3bProfiling } from './Onboard-3b-Profiling';
import { profilingData } from './Onboard-3b-Profiling.fixtures';
import { Onboard6Published } from './Onboard-6-Published';
import { publishedData } from './Onboard-6-Published.fixtures';

// Canvas page "Brand Builder" (issue #50). Titles and tags are the canvas board titles
// (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn); states are the board notes. A variant (2b, Ingest-Error,
// Kit-RegisterFailed, Dashboard-Empty) renders the same screen component with its own fixtures. The live /build and
// /sign-in routes are unchanged.
const page = 'brand' as const;

export const screens: ScreenEntry[] = [
  { artboard: 'Onboard-1-SignIn', page, title: 'Sign in', tag: 'HACKATHON', states: ['success', 'loading', 'error'], render: (state) => createElement(Onboard1SignIn, { data: signInData, state }) },
  { artboard: 'Onboard-2-Domain', page, title: 'Domain (optional for PoC)', tag: 'HACKATHON', states: ['success'], render: () => createElement(Onboard2Domain, { data: domainData }) },
  { artboard: 'Onboard-2b-DomainFailed', page, title: 'Domain: record not found (error)', tag: 'HACKATHON', states: ['error'], render: () => createElement(Onboard2Domain, { data: domainFailedData }) },
  { artboard: 'Onboard-3-Sources', page, title: 'Ingest: add sources', tag: 'FALLBACK', states: ['success', 'empty'], render: (state) => createElement(Onboard3Sources, { data: sourcesData, state }) },
  { artboard: 'Onboard-3b-Profiling', page, title: 'Ingest: reading (loading)', tag: 'FALLBACK', states: ['loading'], render: () => createElement(Onboard3bProfiling, { data: profilingData }) },
  { artboard: 'Ingest-Error', page, title: 'Ingest: source failed (error)', tag: 'FALLBACK', states: ['error'], render: () => createElement(Onboard3bProfiling, { data: ingestErrorData }) },
  {
    artboard: 'BB-1-Basics', page, title: 'Intake 1: basics', tag: 'FALLBACK', states: ['success', 'error'],
    render: (state) => createElement(BB1Basics, { data: state === 'error' ? basicsErrorData : basicsData, state }),
  },
  { artboard: 'BB-2-Origin', page, title: 'Intake 2: origin', tag: 'FALLBACK', states: ['success'], render: () => createElement(BB2Origin, { data: originData }) },
  { artboard: 'BB-3-GoldenCircle', page, title: 'Intake 3: what / how / why', tag: 'FALLBACK', states: ['success'], render: () => createElement(BB3GoldenCircle, { data: goldenCircleData }) },
  { artboard: 'BB-4-Alternatives', page, title: 'Intake 4: alternatives + edge', tag: 'FALLBACK', states: ['success', 'loading'], render: (state) => createElement(BB4Alternatives, { data: alternativesData, state }) },
  { artboard: 'BB-5-Audience', page, title: 'Intake 5: audience', tag: 'FALLBACK', states: ['success'], render: () => createElement(BB5Audience, { data: audienceData }) },
  { artboard: 'BB-6-Voice', page, title: 'Intake 6: voice by example', tag: 'FALLBACK', states: ['success'], render: () => createElement(BB6Voice, { data: voiceData }) },
  { artboard: 'BB-Gate1-Purpose', page, title: 'Gate 1: Purpose', tag: 'FALLBACK', states: ['success'], render: () => createElement(BBGate1Purpose, { data: gatePurposeData }) },
  { artboard: 'BB-Gate2-Positioning', page, title: 'Gate 2: Positioning', tag: 'FALLBACK', states: ['success'], render: () => createElement(BBGate2Positioning, { data: gatePositioningData }) },
  { artboard: 'BB-Gate3-Voice', page, title: 'Gate 3: Voice', tag: 'FALLBACK', states: ['success'], render: () => createElement(BBGate3Voice, { data: gateVoiceData }) },
  { artboard: 'Coverage-Map', page, title: 'Coverage map (17 × E/I/M)', tag: 'HACKATHON', states: ['success'], render: () => createElement(CoverageMap, { data: coverageData }) },
  { artboard: 'Onboard-6-Published', page, title: 'Kit v1 approved + registered (success)', tag: 'HACKATHON', states: ['success'], render: () => createElement(Onboard6Published, { data: publishedData }) },
  { artboard: 'Kit-RegisterFailed', page, title: 'Kit registration failed (error)', tag: 'HACKATHON', states: ['error'], render: () => createElement(Onboard6Published, { data: registerFailedData }) },
  { artboard: 'Kit-Export', page, title: 'Download kit as aDNA folder', tag: 'HACKATHON (THIN)', states: ['success', 'loading', 'error'], render: (state) => createElement(KitExport, { data: kitExportData, state }) },
  { artboard: 'Dashboard', page, title: 'Grow > Ambassadors (was brand dashboard)', tag: 'STRETCH', states: ['success'], render: () => createElement(Dashboard, { data: dashboardData }) },
  { artboard: 'Dashboard-Empty', page, title: 'Ambassadors: empty', tag: 'STRETCH', states: ['empty'], render: () => createElement(Dashboard, { data: dashboardEmptyData }) },
];
