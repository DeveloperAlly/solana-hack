// Sample data for Verify-1-Match, Verify-2-NoMatch, Verify-3-Edited and Verify-5-Retracted (issue #49). They are one
// screen (VerifyCheckScreen); only the pasted text differs, and the check decides the result.
// Sources (AGENTS rule 6): canvas https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Verify-1-Match,
// Verify-2-NoMatch, Verify-3-Edited and Verify-5-Retracted (the pasted text, the notes and the intro line are the
// canvas copy); backend map .agentic/what/context/backend_map.md §4, row "Verify-1, Verify-2, Verify-3".
import type { VerifyCheckData } from './types';
import { adnaLaunchPost, jamjamRetractedPost, registeredPosts } from './posts.fixtures';

const errorNote = 'Solana could not be checked just now, so this cannot be confirmed. Try again in a minute.';

export const verifyMatch: VerifyCheckData = { query: adnaLaunchPost.text, posts: registeredPosts, errorNote };

export const verifyNoMatch: VerifyCheckData = {
  query: 'aDNA is launching a token next week. Early holders get 10x rewards.',
  posts: registeredPosts,
  errorNote,
};

export const verifyEdited: VerifyCheckData = {
  query: "That's the gap aDNA fills: an open standard for project context. It will 10x your team's output.",
  posts: registeredPosts,
  note: 'Verify checks exact matches only today (verifyText in posts.ts); an edited copy shows "Not an official post". This screen needs a fuzzy match.',
  errorNote,
};

export const verifyRetracted: VerifyCheckData = {
  query: jamjamRetractedPost.text,
  posts: registeredPosts,
  intro: 'A brand can retract something it approved. The record stays; the status changes.',
  note: 'Drawn, not built. Defined in: research 10 §7.1 proposal N4 (retracted).',
  errorNote,
};
