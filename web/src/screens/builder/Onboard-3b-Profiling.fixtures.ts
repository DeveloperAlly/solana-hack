// Sample data for Onboard-3b-Profiling. Source: canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
// Onboard-3b-Profiling (note n-ob3b; progress bar at 50); issue #50; backend map §4, row "Onboard-3b-Profiling, Ingest-Error".
import type { ProfilingData } from './types';
import { jamjamBrand } from './shared.fixtures';

export const profilingData: ProfilingData = {
  brand: jamjamBrand,
  progress: 50,
  rows: [
    { id: 'site', name: 'jamjam.tech', status: 'Done · 2 facts found', tone: 'done' },
    { id: 'press', name: '[2023 press or docs links]', status: 'Reading…', tone: 'active' },
    { id: 'sort', name: 'Sorting facts into the 17 kit sections', status: 'Waiting', tone: 'waiting' },
    { id: 'ask', name: 'Working out what to ask you', status: 'Waiting', tone: 'waiting' },
  ],
};
