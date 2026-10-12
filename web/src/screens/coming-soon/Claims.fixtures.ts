// Sample data for Claims. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board Claims,
// issue #51; backend map §4 row "Claims (screen missing)" (GET/POST/PATCH …/claims). Bracketed values stay bracketed.
import type { ClaimsData } from './types';

export const claims: ClaimsData = {
  claims: [
    { id: 'c1', text: '"Anyone can check what really came from you"', evidence: 'jamjam.tech · home page', owner: '[owner]', expires: '[date]', status: 'approved' },
    { id: 'c2', text: '"[n] brands use JamJam"', evidence: 'None yet', owner: '[owner]', expires: '–', status: 'pending' },
    { id: 'c3', text: '[old claim]', evidence: '[source]', owner: '[owner]', expires: '[past date]', status: 'expired' },
  ],
};

export const claimsEmpty: ClaimsData = { claims: [] };
