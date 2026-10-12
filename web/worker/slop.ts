// The no-AI-slop list (backlog G1; ADR-003 "no-AI-slop pass"): one list, used both to tell a model what to avoid
// (SLOP_RULES, in every drafting and polish prompt) and to check its output (posts.ts slopCheck). Before this file the
// prompt and the check each carried their own copy (llm.ts SLOP_RULES, posts.ts BANNED); backlog G1 asks for "one list".

/** A banned term: how the prompt names it, and the lower-case fragments the check looks for (variants included). */
export interface SlopTerm { say: string; match: string[] }

export const SLOP_TERMS: readonly SlopTerm[] = [
  { say: 'delve', match: ['delve'] },
  { say: 'unlock', match: ['unlock'] },
  { say: 'unleash', match: ['unleash'] },
  { say: 'elevate', match: ['elevate'] },
  { say: 'seamless', match: ['seamless'] },
  { say: 'game-changer', match: ['game-changer', 'game changer'] },
  { say: 'revolutionize', match: ['revolutioniz'] },
  { say: 'cutting-edge', match: ['cutting-edge'] },
  { say: "in today's fast-paced world", match: ["in today's fast-paced"] },
  { say: 'landscape', match: ['landscape'] },
  { say: 'tapestry', match: ['tapestry'] },
  { say: 'empower', match: ['empower'] },
  { say: 'leverage', match: ['leverage'] },
  { say: 'synergy', match: ['synergy'] },
  { say: 'robust', match: ['robust'] },
  { say: 'harness', match: ['harness'] },
  { say: 'navigate the', match: ['navigate the'] },
  { say: "it's not just", match: ["it's not just"] },
  { say: 'more than just', match: ['more than just'] },
];

/** The em dash, banned as a character (the prompt says "No em dashes"). */
export const EM_DASH = '—';

/** Fragments the check looks for, in list order, then the em dash. */
export const BANNED: readonly string[] = [...SLOP_TERMS.flatMap((t) => t.match), EM_DASH];

/** The rules every drafting prompt carries, built from the same list the check uses. */
export const SLOP_RULES = `Write plainly and specifically. Never use these words or phrases: ${SLOP_TERMS.map((t) => `"${t.say}"`).join(', ')}. No em dashes. No hype, no exclamation marks, no rhetorical questions. Do not invent facts, numbers, customers or awards.`;
