/*
 * Sample data for J3-Confirm: canvas board J3-Confirm (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, board
 * J3-Confirm) and its note n-j3-confirm, issue #48, backend map §4 rows "Coverage-Map" and "Gate 1, Gate 2, Gate 3".
 * Readiness 58% is the board's sample figure (flagged "Sample data"); "2 questions left · about 2 minutes" is board copy.
 */
import type { ConfirmData } from './types';
import { facts } from './journey.fixtures';

export const confirmFixture: ConfirmData = {
  facts: [
    { ...facts.positioning, section: 'Positioning · Gate 2' },
    { ...facts.purpose, section: 'Purpose · Gate 1' },
    facts.messagingChecked,
    facts.messagingGates,
  ],
  voice: { id: 'voice', section: 'Voice · Gate 3', status: 'partly', statement: 'Plain, direct, second person, no hype.', note: "Inferred from 3 pages. You'll pick the paragraph that sounds right next." },
  missing: { id: 'audience-origin', section: 'Audience · Origin', status: 'needs-you', statement: "Nothing on your pages says who it's for or why you started it.", note: '2 short questions next.' },
  readinessBase: 58,
  questionsLeft: 2,
  timeLeft: 'about 2 minutes',
  deferredNote: "11 more kit sections (values, visual kit, examples and others) appear later in Brand › Kit. They don't block kit v1 (decision D2).",
};
