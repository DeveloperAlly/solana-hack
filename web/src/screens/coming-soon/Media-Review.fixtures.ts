// Sample data for Media-Review. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board
// Media-Review, issue #51; backend map: no media row yet (proposed in issue #51; inventory D3 ChecksPanel); checks reuse
// §4 row "Amb-3, M-3" GET /api/drafts/:id/checks. Results are per slide number, as the canvas draws slides 1 and 3.
// Slide 3's claim is the pending "[n] brands use JamJam" row on the Claims board (claimId c2).
import type { MediaReviewData } from './types';
import { mediaComposer } from './Media-Composer.fixtures';

export const mediaReview: MediaReviewData = {
  formats: mediaComposer.formats,
  checks: {
    1: { claims: 'backed', slop: 'passed', alt: '[alt]' },
    3: { claims: 'unsupported', slop: 'passed', alt: '[alt]', claimId: 'c2', claimPhrase: 'Used by [n] brands' },
  },
};
