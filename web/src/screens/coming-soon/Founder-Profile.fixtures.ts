// Sample data for Founder-Profile. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board
// Founder-Profile, issue #51; backend map §4 row "Onboard-3-Sources" (POST /api/brands/:id/sources, table sources).
import type { FounderProfileData } from './types';

export const founderProfile: FounderProfileData = {
  name: '[Founder name]',
  sources: [
    { id: 'cv', name: 'CV or LinkedIn export', detail: '[uploaded]', status: 'uploaded' },
    { id: 'perception', name: 'How others see you', detail: '[perception audit, optional]', status: 'optional' },
  ],
  linkedTo: 'JamJam · founder',
  sharedStories: true,
};

export const founderProfileEmpty: FounderProfileData = { ...founderProfile, sources: [] };
