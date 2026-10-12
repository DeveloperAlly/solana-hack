// Platform fit as a rule-based lint (backlog T1a; architecture §6.1 "Platform fit" row: "a rule-based lint per platform
// ... Make no performance predictions"; research 03 "Draft-scoring checklist": "[O] checks as rules and [S] checks as
// defaults"). Only checks that can be read from the text are here; checks that need a person or the platform (video
// matches caption, author replies to comments, posting cadence) are not scored, so a score never claims more than it
// checked. Hard rules are limits the platform enforces: a post over them cannot be published as written.
import { xWeightedLength } from '../posts';
import { sentences, words } from './text';

export interface LintRule { id: string; label: string; kind: 'O' | 'S'; hard: boolean; passed: boolean; source: string }
export interface PlatformLint { channel: 'x' | 'linkedin' | 'threads' | null; rules: LintRule[]; fit: number | null; hardFailures: string[] }

const R03 = 'research 03, Draft-scoring checklist';
const URL = /https?:\/\/\S+|\bwww\.\S+/gi;
// LinkedIn downranks engagement bait such as "Comment 'Yes'" (research 03, LinkedIn, Social Media Today).
const BAIT = /\b(comment|type|reply|drop)\s+["'‘’“”]?(yes|me|agree|1|interested|\w+)["'‘’“”]?\s+(below|if|to|for)\b|\b(like|repost|share)\s+(this\s+)?if\b|\btag\s+(someone|a friend|3)\b|\bagree\s*\?/i;
// A first line that only works if the reader clicks or expands (research 03, X: "Hook works without a click").
const CLICK_HOOK = /\b(link (below|in (the )?(bio|comments?|reply))|click (here|below|the link)|see (the )?link|read more below|\(?thread\)?\s*$)|\u{1F447}/iu;

export function channelOf(channel: string | null | undefined): PlatformLint['channel'] {
  const c = (channel ?? '').trim().toLowerCase();
  if (c === 'x' || c === 'twitter' || c === 'x (twitter)') return 'x';
  if (c === 'linkedin') return 'linkedin';
  if (c === 'threads') return 'threads';
  return null;
}

/**
 * Broetry: one short sentence per line, many lines. LinkedIn moved off "read more" signals after broetry gamed them
 * (research 03, LinkedIn, Dan Roth). Threshold (6 or more lines, 80% of them one sentence of 12 words or fewer) is an
 * initial, uncalibrated value.
 */
export function isBroetry(text: string): boolean {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 6) return false;
  const short = lines.filter((l) => sentences(l).length <= 1 && words(l).length <= 12).length;
  return short / lines.length >= 0.8;
}

export function lintPlatform(text: string, channel: string | null | undefined): PlatformLint {
  const ch = channelOf(channel);
  const links = (text.match(URL) ?? []).length;
  const first = text.split('\n').find((l) => l.trim()) ?? '';
  const rules: LintRule[] = [];
  if (ch === 'x') {
    rules.push({ id: 'x_length', label: 'Within 280 characters as X counts them', kind: 'O', hard: true, passed: xWeightedLength(text) <= 280, source: 'twitter-text 3.1.0 configs.version3 (posts.ts xWeightedLength)' });
    rules.push({ id: 'x_hook', label: 'The first line works without a click', kind: 'O', hard: false, passed: !CLICK_HOOK.test(first), source: R03 });
    rules.push({ id: 'x_link_cost', label: 'No link in the post body (an API post with a link costs $0.20, not $0.015)', kind: 'O', hard: false, passed: links === 0, source: `${R03}; X API pricing` });
  }
  if (ch === 'linkedin') {
    rules.push({ id: 'li_length', label: 'Within 3,000 characters', kind: 'O', hard: true, passed: [...text].length <= 3000, source: 'LinkedIn UGC Post API: "The maximum length of the text of a UGC Post is 3000 characters" (https://learn.microsoft.com/en-us/linkedin/compliance/integrations/shares/ugc-post-api)' });
    rules.push({ id: 'li_bait', label: 'No engagement bait', kind: 'O', hard: false, passed: !BAIT.test(text), source: R03 });
    rules.push({ id: 'li_broetry', label: 'Not broetry (one short line after another)', kind: 'O', hard: false, passed: !isBroetry(text), source: R03 });
    rules.push({ id: 'li_link', label: 'No link in the post body (company pages lose reach on links)', kind: 'S', hard: false, passed: links === 0, source: `${R03}; Ordinal link penalty study` });
  }
  if (ch === 'threads') {
    rules.push({ id: 'threads_links', label: '5 links or fewer', kind: 'O', hard: true, passed: links <= 5, source: `${R03}; Threads API` });
  }
  const fit = rules.length ? Math.round((rules.filter((r) => r.passed).length / rules.length) * 100) : null;
  return { channel: ch, rules, fit, hardFailures: rules.filter((r) => r.hard && !r.passed).map((r) => r.label) };
}
