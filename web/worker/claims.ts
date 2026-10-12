// H9 (issue #62; canvas J6 "claims highlighted and linked to their evidence"): before Approve, each factual claim in a
// draft is listed with the facts it rests on, or marked unsupported. Read-only and for display: the claims gate in
// posts.ts (policyCheck, run by approvePost) stays the only thing that decides approval. The facts offered are the
// registered kit's own evidence snapshot, allow-listed exactly as the gate reads them, so the screen and the gate look
// at the same evidence.
import { db } from './db';
import { HttpError, type Env } from './env';
import { chat, parseJson } from './llm';
import { CLAIMS_POLICY, postPolicy, type Post } from './posts';
import { snapshotFact, usableFact } from './sources/registry';

export interface ClaimFact { id: string | null; claim: string; quote: string | null }
export interface ClaimItem { text: string; kind: 'factual' | 'opinion'; status: 'supported' | 'unsupported' | 'opinion'; facts: ClaimFact[] }
export interface ClaimMap { rev: number; claimsGate: string; items: ClaimItem[]; unsupported: number }

/** Most facts offered in one call; a kit with more is checked by the gate in batches, and the map says it is partial. */
export const MAX_MAP_FACTS = 120;

/**
 * Decides the map from the model's raw reply; pure, so it is testable without a model. Fails closed on the wrong
 * shape. A fact number that is not in the list is dropped (never invented), and a factual claim left with no valid
 * fact is unsupported.
 */
export function claimMapFrom(raw: unknown, facts: ClaimFact[], rev: number, claimsGate: string): ClaimMap {
  const list = (raw as { claims?: unknown } | null)?.claims;
  if (!Array.isArray(list)) throw new HttpError(502, 'the claims check returned an unusable answer; try again');
  const items: ClaimItem[] = [];
  for (const c of list as { text?: unknown; opinion?: unknown; facts?: unknown }[]) {
    if (typeof c?.text !== 'string' || !c.text.trim()) continue;
    const opinion = c.opinion === true;
    const nums = Array.isArray(c.facts) ? c.facts.filter((n): n is number => Number.isInteger(n)) : [];
    const used = [...new Set(nums)].filter((n) => n >= 1 && n <= facts.length).map((n) => facts[n - 1]);
    const status: ClaimItem['status'] = opinion ? 'opinion' : used.length ? 'supported' : 'unsupported';
    items.push({ text: c.text.trim().slice(0, 500), kind: opinion ? 'opinion' : 'factual', status, facts: opinion ? [] : used });
  }
  return { rev, claimsGate, items, unsupported: items.filter((i) => i.status === 'unsupported').length };
}

/** Builds the claim map for one revision of a post and stores it on the post's checks, bound to that revision. */
export async function claimMap(env: Env, post: Post & { rev?: number }): Promise<ClaimMap> {
  const { claims, evidence } = await postPolicy(env, post);
  const facts: ClaimFact[] = (evidence ?? []).map(snapshotFact).filter(usableFact).slice(0, MAX_MAP_FACTS)
    .map((e) => ({ id: (e as { id?: string }).id ?? null, claim: e.claim, quote: e.quote ?? null }));
  const numbered = facts.map((f, i) => `[${i + 1}] ${f.claim}${f.quote ? ` (quote: "${f.quote}")` : ''}`).join('\n') || '(no facts)';
  const system = `You map the claims in one social post to the facts that support them. Do not rewrite the post. Claims gate, ${CLAIMS_POLICY[claims]}.
List every claim in the post, in order. For each: "text" (the claim, quoted briefly from the post), "opinion" (true only for an opinion, intention or call to action, which needs no evidence), and "facts" (the numbers of the facts that support it; an empty list if none do). Only cite a fact that states the claim. Reply with JSON only: {"claims": [{"text": string, "opinion": boolean, "facts": number[]}]}.`;
  const { text } = await chat(env, system, `Facts:\n${numbered}\n\nPost:\n${post.body}`);
  const map = claimMapFrom(parseJson<unknown>(text), facts, post.rev ?? 0, claims);
  await db.update(env, 'posts', `${db.eq('id', post.id)}&${db.eq('rev', String(post.rev ?? 0))}`, { checks: { ...post.checks, claimMap: map } });
  return map;
}
