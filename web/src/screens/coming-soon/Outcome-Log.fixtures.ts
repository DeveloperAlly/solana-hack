// Sample data for Outcome-Log. Source: wireframe canvas (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn), board
// Outcome-Log, issue #51; backend map: no row yet (proposed in issue #51); closest table is `leads`
// (§3 "Experimental or later"). Every value is bracketed as on the canvas: roles and company types only.
import type { OutcomeLogData } from './types';

export const outcomeLog: OutcomeLogData = {
  outcomes: [
    { id: 'o1', date: '[date]', who: '[role, company type]', foundVia: 'LinkedIn post "[title]"', fit: 'yes', repliedIn: '[2 h]', outcome: '[Call booked]' },
    { id: 'o2', date: '[date]', who: '[role]', foundVia: '"How did you find us?" → Verify page', fit: 'unsure', repliedIn: '[1 d]', outcome: '[Open]' },
  ],
};

export const outcomeLogEmpty: OutcomeLogData = { outcomes: [] };
