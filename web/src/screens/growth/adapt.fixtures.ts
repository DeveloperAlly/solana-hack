// Sample data for Distribute-Adapt (canvas v21 board Distribute-Adapt; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
// The post and its X, LinkedIn and Threads versions are the board's aDNA copy, written out in full where the board
// truncates it; Bluesky and Substack versions are sample adaptations. The Bluesky version carries one unsourced claim
// so the claims gate has something to block, on any text that still makes that claim (canvas note: "a version fails a check"). Platforms are registry ids
// (config/platforms.ts); the board's "Newsletter" is Substack in the registry. Slots and the taken slot are samples.
import { fingerprintOf } from '../../domain/approval';
import { sampleApprover, sampleBrainVersion, sampleDraft } from './drafts';
import type { AdaptData } from './types';

const xText = 'Your agent didn’t forget. It was never told. Every new session starts blank because project context lives in people’s heads. aDNA puts it in the repo, in one folder your agent reads first.';

const post = sampleDraft({ id: 'p-never-told', name: 'X · It was never told', platform: 'x', campaign: 'Launch week', text: xText, approved: true });

const versions: AdaptData['versions'] = {
  x: { text: xText, unsourcedClaims: [] },
  linkedin: { text: 'Your agent didn’t forget. It was never told.\n\nEvery new session starts blank because project context lives in people’s heads. aDNA puts it in the repo, in one folder your agent reads first, so the next session starts where the last one ended.', unsourcedClaims: [] },
  threads: { text: 'Your agent didn’t forget. It was never told. Here’s the fix, in one folder.', unsourcedClaims: [] },
  bluesky: { text: 'Your agent didn’t forget. It was never told. aDNA fixes that for every team that tries it.', unsourcedClaims: ['for every team that tries it'] },
  substack: { text: 'Why your agent keeps starting from zero, and the one folder that fixes it. [long-form adaptation]', unsourcedClaims: [] },
};

export const adapt: AdaptData = {
  post,
  approver: sampleApprover,
  platformIds: ['x', 'linkedin', 'threads', 'bluesky', 'substack'],
  chosen: ['x', 'linkedin', 'threads'],
  versions,
  approvals: { x: { by: sampleApprover, at: '[date]', fingerprint: fingerprintOf(xText, xText, sampleBrainVersion) } },
  slots: ['Tue 09:30 (best time)', 'Tue 13:00', 'Wed 09:30', 'Now'],
  taken: [{ platformId: 'linkedin', slot: 'Tue 09:30 (best time)', what: 'another aDNA post' }],
};

/** Canvas state "no platforms chosen (Schedule disabled)". */
export const adaptNoneChosen: AdaptData = { ...adapt, chosen: [] };
