// H9 (issue #62; canvas J6 "claims highlighted and linked to their evidence"): before Approve, each factual claim in a
// draft is listed with the facts it rests on, or marked unsupported. Read-only and for display: the claims gate in
// posts.ts (policyCheck, run by approvePost) stays the only thing that decides approval. The facts offered are the
// registered kit's own evidence snapshot, allow-listed exactly as the gate reads them, and the selected claims gate
// decides which claims need evidence at all, so the screen and the gate agree.
import { db } from './db';
import { HttpError, type Env } from './env';
import { chat, parseJson } from './llm';
import { CLAIMS_POLICY, evidenceBatches, factLine, MAX_EVIDENCE_BATCHES, postPolicy, type Post } from './posts';
import { snapshotFact, usableFact } from './sources/registry';

export interface ClaimFact { id: string | null; claim: string; quote: string | null }
/** not_required: a factual claim the brand's claims gate lets through without evidence (light gate, for example). */
export type ClaimStatus = 'supported' | 'unsupported' | 'opinion' | 'not_required';
export interface ClaimItem { text: string; kind: 'factual' | 'opinion'; status: ClaimStatus; facts: ClaimFact[] }
export interface ClaimMap { rev: number; claimsGate: string; items: ClaimItem[]; unsupported: number; partial: boolean }

/**
 * The kit's facts in the same batches the gate uses: evidenceBatches over the same lines (posts.ts factLine), so a
 * claim the gate can support is one the map can show as supported. Each batch keeps its facts in order.
 */
export function factBatches(facts: ClaimFact[]): ClaimFact[][] {
  if (!facts.length) return [[]];
  const lines = facts.map(factLine);
  const out: ClaimFact[][] = [];
  let i = 0;
  for (const batch of evidenceBatches(lines)) {
    const group: ClaimFact[] = [];
    let rest = batch;
    while (i < facts.length && rest.startsWith(lines[i])) { group.push(facts[i]); rest = rest.slice(lines[i].length + 1); i++; }
    // A single line longer than a whole batch is split by evidenceBatches across batches; it stays with its first batch.
    if (!group.length && i < facts.length) { group.push(facts[i]); i++; }
    if (group.length) out.push(group);
  }
  return out;
}

const numbers = (v: unknown, max: number) => (Array.isArray(v) ? [...new Set(v.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= max))] : []);
const statusOf = (item: Omit<ClaimItem, 'status'> & { needsEvidence: boolean }): ClaimStatus =>
  item.kind === 'opinion' ? 'opinion' : item.facts.length ? 'supported' : item.needsEvidence ? 'unsupported' : 'not_required';

/**
 * Decides the map from the first batch's raw reply; pure, so it is testable without a model. Fails closed on the wrong
 * shape. A fact number outside the batch is dropped (never invented). needsEvidence defaults to true, so a claim the
 * model did not classify is shown as needing evidence rather than waved through.
 */
export function claimMapFrom(raw: unknown, facts: ClaimFact[], rev: number, claimsGate: string, partial = false): ClaimMap {
  const list = (raw as { claims?: unknown } | null)?.claims;
  if (!Array.isArray(list)) throw new HttpError(502, 'the claims check returned an unusable answer; try again');
  const items: ClaimItem[] = [];
  for (const c of list as { text?: unknown; opinion?: unknown; needsEvidence?: unknown; facts?: unknown }[]) {
    if (typeof c?.text !== 'string' || !c.text.trim()) continue;
    const kind: ClaimItem['kind'] = c.opinion === true ? 'opinion' : 'factual';
    const used = kind === 'opinion' ? [] : numbers(c.facts, facts.length).map((n) => facts[n - 1]);
    const base = { text: c.text.trim().slice(0, 500), kind, facts: used };
    items.push({ ...base, status: statusOf({ ...base, needsEvidence: c.needsEvidence !== false }) });
  }
  return summarise({ rev, claimsGate, items, unsupported: 0, partial });
}

/** Adds support found in a later batch to the claims still unsupported; pure. */
export function mergeSupport(map: ClaimMap, raw: unknown, facts: ClaimFact[]): ClaimMap {
  const list = (raw as { supports?: unknown } | null)?.supports;
  if (!Array.isArray(list)) throw new HttpError(502, 'the claims check returned an unusable answer; try again');
  const items = map.items.map((item) => {
    if (item.status !== 'unsupported') return item;
    const hit = (list as { text?: unknown; facts?: unknown }[]).find((s) => s?.text === item.text);
    const add = hit ? numbers(hit.facts, facts.length).map((n) => facts[n - 1]) : [];
    return add.length ? { ...item, facts: add, status: 'supported' as const } : item;
  });
  return summarise({ ...map, items });
}

const summarise = (m: ClaimMap): ClaimMap => ({ ...m, unsupported: m.items.filter((i) => i.status === 'unsupported').length });
const numbered = (facts: ClaimFact[]) => facts.map((f, i) => `[${i + 1}] ${f.claim}${f.quote ? ` (quote: "${f.quote}")` : ''}`).join('\n') || '(no facts)';

/** Builds the claim map for one revision of a post and stores it on the post's checks, bound to that revision. */
export async function claimMap(env: Env, post: Post & { rev?: number }): Promise<ClaimMap> {
  const { claims, evidence } = await postPolicy(env, post);
  const all: ClaimFact[] = (evidence ?? []).map(snapshotFact).filter(usableFact).map((e) => ({ id: (e as { id?: string }).id ?? null, claim: e.claim, quote: e.quote ?? null }));
  const batches = factBatches(all);
  // The same bound as the gate: past it the gate refuses approval too, so the map says it could not check everything.
  const partial = batches.length > MAX_EVIDENCE_BATCHES;
  const used = batches.slice(0, MAX_EVIDENCE_BATCHES);
  const system = `You map the claims in one social post to the facts that support them. Do not rewrite the post. Claims gate, ${CLAIMS_POLICY[claims]}.
List every claim in the post, in order. For each: "text" (the claim, quoted briefly from the post), "opinion" (true only for an opinion, intention or call to action), "needsEvidence" (true when this claims gate requires evidence for it, false when the gate lets it through without evidence), and "facts" (the numbers of the facts that support it; an empty list if none do). Only cite a fact that states the claim. Reply with JSON only: {"claims": [{"text": string, "opinion": boolean, "needsEvidence": boolean, "facts": number[]}]}.`;
  const first = await chat(env, system, `Facts:\n${numbered(used[0])}\n\nPost:\n${post.body}`);
  let map = claimMapFrom(parseJson<unknown>(first.text), used[0], post.rev ?? 0, claims, partial);
  // Later batches only re-check the claims still unsupported, exactly as the gate does.
  for (const batch of used.slice(1)) {
    const open = map.items.filter((i) => i.status === 'unsupported');
    if (!open.length) break;
    const r = await chat(env, `You check which facts support each claim. Reply with JSON only: {"supports": [{"text": string, "facts": number[]}]}, each text copied exactly from the claims list, facts as numbers from the list, an empty list if none support it.`, `Claims:\n${open.map((c) => `- ${c.text}`).join('\n')}\n\nFacts:\n${numbered(batch)}`);
    map = mergeSupport(map, parseJson<unknown>(r.text), batch);
  }
  await db.update(env, 'posts', `${db.eq('id', post.id)}&${db.eq('rev', String(post.rev ?? 0))}`, { checks: { ...post.checks, claimMap: map } });
  return map;
}
