// Sample learn-loop proposals for aDNA, from canvas v24 board Learn-Rules (https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn).
// The evaluator wording is the board's ("A second evaluator, not the model that proposed it").
import type { Proposal } from '../proposal';

const evaluator = 'A second evaluator, not the model that proposed it';

export const adnaProposals: Proposal[] = [
  {
    id: 'p-problem-x', ruleId: 'r-problem-x', scope: 'Create · X', title: 'Open X threads with the problem, not the product',
    evidence: '14 of your X threads over 30 days. The 6 that opened with the problem got more replies than the 8 that opened with the product.',
    cites: { label: 'See the 14 posts', artboard: 'Analytics' }, signal: 'platform-metrics',
    evaluator: { name: evaluator, verdict: 'the pattern holds', smallSample: true }, brainVersion: '3.1', status: 'pending',
  },
  {
    id: 'p-recaps', ruleId: 'r-recaps', scope: 'Grow · events', title: 'Post event recaps within 24 hours',
    evidence: '3 events: recaps posted the next day were checked on Verify more often than ones posted later.',
    cites: { label: 'See the events', artboard: 'Events' }, signal: 'outcome',
    evaluator: { name: evaluator, verdict: 'the pattern holds', smallSample: true }, brainVersion: '3.1', status: 'pending',
  },
  {
    id: 'p-lead', ruleId: 'r-lead', scope: 'All voices', title: 'Lead with the problem',
    evidence: '[What the edits showed]', cites: { label: 'In the Brain', artboard: 'Brain' }, signal: 'edit-to-rule',
    evaluator: { name: evaluator, verdict: 'the pattern holds', smallSample: false }, brainVersion: '3', status: 'approved', decided: { at: '10 Oct', version: '3.1' },
  },
  {
    id: 'p-emojis', ruleId: 'r-emojis', scope: 'Create · X', title: 'Use more emojis on X',
    evidence: '[What the approvals showed]', cites: { label: 'See the drafts', artboard: 'Content-Dashboard' }, signal: 'approvals',
    evaluator: { name: evaluator, verdict: 'not supported', smallSample: true }, brainVersion: '3', status: 'rejected', decided: { at: '2 Oct' },
  },
];

/** The learn loop's proposals for a demo brand by id; only aDNA has results to learn from yet. */
export const proposalsFor = (brandId: string): Proposal[] => (brandId === 'adna' ? adnaProposals : []);
