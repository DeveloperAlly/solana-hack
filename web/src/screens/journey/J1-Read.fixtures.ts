/*
 * Sample data for J1-Read: canvas board J1-Read (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board J1-Read) and
 * its note n-j1-read, issue #48, backend map §4 rows "Onboard-3-Sources" and "Onboard-3b-Profiling, Ingest-Error".
 * Source statuses are canvas sample data (the board flags them "Sample data"). Coverage is the board's figure:
 * 3 found, 1 partly, 2 need you, bar at 58%.
 */
import type { ReadData } from './types';
import { facts } from './journey.fixtures';

/** Success: the board as drawn. Reading goes on, and one source is blocked (its panel shows from the data). */
export const readFixture: ReadData = {
  site: 'jamjam.tech',
  sources: [
    { id: 'home', label: 'jamjam.tech', status: 'read', facts: 4 },
    { id: 'how', label: '/how-it-works', status: 'reading' },
    { id: 'verify', label: '/verify', status: 'queued' },
    { id: 'docs', label: 'docs.example.com', status: 'blocked', reason: 'its robots.txt says no' },
  ],
  facts: [facts.positioning, facts.purpose, facts.messagingChecked, facts.voiceRead],
  coverage: { found: 3, partly: 1, needsYou: 2, percent: 58 },
};

/** Loading: every source still "Reading…" or queued; no facts yet (note n-j1-read, STATES: loading). */
export const readFixtureLoading: ReadData = {
  ...readFixture,
  sources: readFixture.sources.map((s) => ({ ...s, status: s.id === 'home' ? 'reading' : 'queued', facts: undefined, reason: undefined })),
  facts: [],
  coverage: { found: 0, partly: 0, needsYou: 6, percent: 0 },
};

/** Error: the site itself is blocked, so the blocked-source panel offers paste, upload or skip (STATES: error). */
export const readFixtureBlocked: ReadData = {
  ...readFixture,
  sources: [{ id: 'home', label: 'jamjam.tech', status: 'blocked', reason: 'its robots.txt says no' }],
  facts: [],
  coverage: { found: 0, partly: 0, needsYou: 6, percent: 0 },
};

/** Empty: the site was read but says nothing usable, so the flow goes straight to questions (STATES: empty site). */
export const readFixtureEmpty: ReadData = {
  ...readFixture,
  sources: [{ id: 'home', label: 'jamjam.tech', status: 'read', facts: 0 }],
  facts: [],
  coverage: { found: 0, partly: 0, needsYou: 6, percent: 0 },
};
