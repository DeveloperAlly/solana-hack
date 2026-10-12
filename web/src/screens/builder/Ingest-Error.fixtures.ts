// Sample data for Ingest-Error: the reading screen with one source failed. Source: canvas
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board Ingest-Error (note n-ingerr); issue #50; backend map §4, row
// "Onboard-3b-Profiling, Ingest-Error".
import type { ProfilingData } from './types';
import { jamjamBrand } from './shared.fixtures';

export const ingestErrorData: ProfilingData = {
  brand: jamjamBrand,
  progress: 100,
  sources: [
    { id: 'site', name: 'jamjam.tech', status: 'Done · 2 facts found', tone: 'done' },
    { id: 'press', name: '[2023 press or docs links]', status: 'Failed', tone: 'failed', error: "Couldn't open this page: it returned an error or blocks automated reading." },
  ],
  stages: [
    { id: 'sort', name: 'Sorting facts into the 17 kit sections', status: 'Done', tone: 'done' },
  ],
};
