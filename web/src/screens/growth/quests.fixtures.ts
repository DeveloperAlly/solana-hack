// Sample data for Quests (canvas v24 board Quests; https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn). Quest copy, rewards,
// slots and dates are the board's (submissions paid before this session are placeholder ids); the "Paid this month" figure is the board's 140 USDC. People are bracketed. The two
// submissions waiting are items of the one approval queue (domain/queue.ts), so Today and Quests decide the same items.
import type { QuestsData } from './types';

export const quests: QuestsData = {
  quests: [
    { id: 'qst-tutorial', task: 'Write a tutorial: set up aDNA in an existing repo', format: 'tutorial', rewardUsdc: 50, slots: 5, paidSubmissionIds: ['[paid-tutorial-1]', '[paid-tutorial-2]'], due: 'Fri 24 Oct', opens: null },
    { id: 'qst-demo', task: 'Record a 2-minute demo of an agent reading the folder', format: 'video', rewardUsdc: 30, slots: 3, paidSubmissionIds: ['[paid-demo-1]', '[paid-demo-2]'], due: 'Sun 26 Oct', opens: null },
    { id: 'qst-answers', task: 'Answer 5 setup questions in the community', format: 'answers', rewardUsdc: 10, slots: 10, paidSubmissionIds: [], due: null, opens: null },
  ],
  submissions: [
    {
      id: 'q-quest-answers-1', kind: 'ambassadorPost', questId: 'qst-answers', chip: 'Quest · Community answers', text: '[Creator name] answered 5 setup questions in the community',
      meta: '10 USDC to their wallet on approval · disclosure present', payout: { amount: 10, unit: 'USDC' }, verified: true, disclosure: 'present', open: { label: 'Review', artboard: 'Quests' },
    },
    {
      id: 'q-quest-answers-2', kind: 'ambassadorPost', questId: 'qst-answers', chip: 'Quest · Community answers', text: '[Creator name] answered 5 setup questions in the community',
      meta: '10 USDC to their wallet on approval · disclosure missing', payout: { amount: 10, unit: 'USDC' }, verified: true, disclosure: 'missing', open: { label: 'Review', artboard: 'Quests' },
    },
  ],
  paidThisMonth: 140,
  suggestions: [
    { task: 'Write a tutorial: set up aDNA in an existing repo', format: 'tutorial', reward: '', slots: '', due: '' },
    { task: 'Record a 2-minute demo of an agent reading the folder', format: 'video', reward: '', slots: '', due: '' },
    { task: 'Answer 5 setup questions in the community', format: 'answers', reward: '', slots: '', due: '' },
  ],
};

/** No quests yet (canvas note: "no quests (empty: suggest three from the kit)"). */
export const questsEmpty: QuestsData = { ...quests, quests: [], submissions: [], paidThisMonth: 0 };
