// Sample data for Media-Review. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board
// Media-Review, issue #51; backend map: no row yet (canvas: "draft backlog (media review); ChecksPanel D3"); checks reuse
// §4 row "Amb-3, M-3" GET /api/drafts/:id/checks. Text in brackets stays bracketed as on the canvas.
import type { MediaReviewData } from './types';

export const mediaReview: MediaReviewData = {
  checks: [
    { id: 's1', slide: 1, text: '[hook]', claims: 'backed', slop: 'passed', alt: '[alt]' },
    { id: 's3', slide: 3, text: '"Used by [n] brands"', claims: 'unsupported', slop: 'passed', alt: '[alt]' },
  ],
};
