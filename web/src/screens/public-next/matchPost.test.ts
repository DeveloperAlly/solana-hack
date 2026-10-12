import { it } from 'vitest';
import { similarity, wordDiff } from './matchPost';

it('probe', () => {
  const o = "That's the gap aDNA fills: an open standard for project context that any agent can read, version and audit. One shared file. No lock-in.";
  const p = "That's the gap aDNA fills: an open standard for project context. It will 10x your team's output.";
  const d = wordDiff(o, p);
  console.log(JSON.stringify(d), similarity(d));
  const n = 'aDNA is launching a token next week. Early holders get 10x rewards.';
  console.log(similarity(wordDiff(o, n)), similarity(wordDiff('My coding agent lost a full day of work last week. Not the code. The context.', n)));
});
