// Retrieval for drafting (backlog X16; architecture §6.2 rung 1 "retrieval of 3-5 approved posts by topic plus 1-2 by
// style", §2a.2 Retrieval row "filtered by the evidence allow-list before similarity"; issue #93).
//
// Two layers, so the ranker can change without touching what may be retrieved:
// 1. The corpus (loadCorpus) holds only what the allow-list lets through: usable facts (sources/registry.ts usableFact),
//    the brand's own approved or registered posts, and passages from the brand's own sources (trust 'owned').
//    Nothing outside it is ever ranked, so nothing outside it can reach a prompt.
// 2. A Ranker orders each kind of document for the query. bm25_v1 is lexical; an embedding ranker (pgvector or
//    Cloudflare Vectorize) is a second implementation of the same interface, left as a follow-up (issue #93).
import { db } from '../db';
import type { Env } from '../env';
import { SOURCE_TYPES, snapshotFact, usableFact } from '../sources/registry';
import { terms } from './text';

export type DocKind = 'fact' | 'post' | 'excerpt';
export interface Doc { id: string; kind: DocKind; text: string; at?: string | null; meta?: Record<string, string | null> }
export interface Ranked extends Doc { score: number }

/** Orders documents of one kind by relevance to a query. Async, so an embedding ranker fits the same shape. */
export interface Ranker { id: string; rank(docs: Doc[], query: string): Promise<Ranked[]> }

/**
 * Okapi BM25 with k1 = 1.2 and b = 0.75 and the non-negative idf ln(1 + (N - n + 0.5) / (n + 0.5)), as in Robertson and
 * Zaragoza, "The Probabilistic Relevance Framework: BM25 and Beyond" (2009, https://doi.org/10.1561/1500000019) and
 * Lucene's BM25Similarity. Ties keep the input order, so ranking is deterministic.
 */
export function bm25Scores(docs: Doc[], query: string, k1 = 1.2, b = 0.75): number[] {
  const toks = docs.map((d) => terms(d.text));
  const avg = toks.reduce((n, t) => n + t.length, 0) / Math.max(1, toks.length);
  const df = new Map<string, number>();
  for (const t of toks) for (const w of new Set(t)) df.set(w, (df.get(w) ?? 0) + 1);
  const q = [...new Set(terms(query))];
  return toks.map((t) => {
    const tf = new Map<string, number>();
    for (const w of t) tf.set(w, (tf.get(w) ?? 0) + 1);
    let s = 0;
    for (const w of q) {
      const f = tf.get(w);
      if (!f) continue;
      const n = df.get(w) ?? 0;
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
      s += (idf * f * (k1 + 1)) / (f + k1 * (1 - b + (b * t.length) / Math.max(1, avg)));
    }
    return s;
  });
}

export const BM25: Ranker = {
  id: 'bm25_v1',
  async rank(docs, query) {
    const scores = bm25Scores(docs, query);
    return docs.map((d, i) => ({ ...d, score: Math.round(scores[i] * 1000) / 1000, i })).sort((a, b) => b.score - a.score || a.i - b.i).map(({ i: _i, ...d }) => d);
  },
};

export interface Corpus { facts: Doc[]; posts: Doc[]; excerpts: Doc[] }
export interface RetrieveOpts {
  /** Facts the drafter may cite. A small fact set fits whole; a large one is cut to the most relevant. */
  facts: number;
  /** Approved posts chosen by topic (score above 0). */
  postsByTopic: number;
  /** Further approved posts chosen by recency, for style (LaMP: recency and relevance matter most; §6.2). */
  postsByRecency: number;
  /** Passages from the brand's own sources chosen by topic (score above 0). */
  excerpts: number;
  ranker?: Ranker;
}
/** Defaults from architecture §6.2 rung 1: 3-5 approved posts by topic plus 1-2 by style. */
export const RETRIEVE_DEFAULTS: RetrieveOpts = { facts: 30, postsByTopic: 3, postsByRecency: 2, excerpts: 3 };

export interface Retrieved { ranker: string; facts: Ranked[]; posts: Ranked[]; excerpts: Ranked[] }

export interface FactInput { id?: string; claim: string; quote?: string | null; origin?: string; trust?: string | null; review_status?: string | null }

/**
 * Facts as retrievable documents, allow-listed here, before any ranking (§2a.2). A fact with no id cannot be cited by a
 * claim, so it is left out too. Kit snapshots registered before migration 009 are read as the migration backfills
 * live rows (snapshotFact), so a legacy source fact stays out.
 */
export function factDocs(facts: FactInput[]): Doc[] {
  return facts.map(snapshotFact).filter(usableFact).filter((f) => typeof f.id === 'string' && f.id)
    .map((f) => ({ id: f.id!, kind: 'fact' as const, text: f.claim, meta: { quote: f.quote ?? null, trust: f.trust } }));
}

/** Passages of a source text: paragraphs merged up to about 700 characters, at most `max` passages. */
export function passages(text: string, max = 40, size = 700): string[] {
  const out: string[] = [];
  let cur = '';
  for (const para of text.split(/\n\s*\n|\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter((p) => p.length >= 40)) {
    if (cur && cur.length + para.length + 1 > size) { out.push(cur); cur = ''; if (out.length >= max) break; }
    cur = cur ? `${cur} ${para}` : para.slice(0, size);
  }
  if (cur && out.length < max) out.push(cur);
  return out;
}

/** Source kinds whose text is the brand's own words (trust 'owned' in the source type registry). */
export const OWNED_KINDS: readonly string[] = Object.values(SOURCE_TYPES).filter((t) => t.trust === 'owned').map((t) => t.kind);
/** Characters of one source's text read for passages: a bound on Worker CPU per draft (issue #93 risks). */
export const MAX_SOURCE_CHARS = 20_000;

/**
 * The brand's retrievable corpus, allow-listed: usable facts (as given, filtered again here), the brand's approved or
 * registered posts, and passages of the kit's sources whose kind is owned and which were read. A third-party page, a
 * failed source and a source of unknown kind (before migration 009) are never read.
 */
export async function loadCorpus(env: Env, brandId: string, kit: { facts: FactInput[]; sourceIds: string[] }): Promise<Corpus> {
  const ids = kit.sourceIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const [posts, sources] = await Promise.all([
    db.select<{ id: string; body: string; channel: string | null; approved_at: string | null; created_at: string }>(env, 'posts', `${db.eq('brand_id', brandId)}&status=in.(approved,registered)&select=id,body,channel,approved_at,created_at&order=approved_at.desc.nullslast,id.asc&limit=200`),
    ids.length ? db.select<{ id: string; kind: string | null; url: string | null; status: string; source_text: string | null; text_excerpt: string | null }>(env, 'sources', `${db.eq('brand_id', brandId)}&id=in.(${ids.join(',')})&select=id,kind,url,status,source_text,text_excerpt`) : Promise.resolve([]),
  ]);
  const excerpts = sources
    .filter((s) => s.status === 'read' && OWNED_KINDS.includes(s.kind ?? ''))
    .sort((a, b) => a.id.localeCompare(b.id))
    .flatMap((s) => passages((s.source_text ?? s.text_excerpt ?? '').slice(0, MAX_SOURCE_CHARS)).map((text, i) => ({ id: `${s.id}#${i}`, kind: 'excerpt' as const, text, meta: { source: s.id, url: s.url } })));
  return {
    facts: factDocs(kit.facts),
    posts: posts.map((p) => ({ id: p.id, kind: 'post' as const, text: p.body, at: p.approved_at ?? p.created_at, meta: { channel: p.channel } })),
    excerpts,
  };
}

/** Ranks an allow-listed corpus for a query (pure apart from the ranker). */
export async function rankCorpus(corpus: Corpus, query: string, opts: RetrieveOpts = RETRIEVE_DEFAULTS): Promise<Retrieved> {
  const ranker = opts.ranker ?? BM25;
  const [facts, posts, excerpts] = await Promise.all([ranker.rank(corpus.facts, query), ranker.rank(corpus.posts, query), ranker.rank(corpus.excerpts, query)]);
  const byTopic = posts.filter((p) => p.score > 0).slice(0, opts.postsByTopic);
  const taken = new Set(byTopic.map((p) => p.id));
  const byRecency = [...posts].filter((p) => !taken.has(p.id)).sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')) || a.id.localeCompare(b.id)).slice(0, opts.postsByRecency);
  return {
    ranker: ranker.id,
    facts: facts.slice(0, opts.facts),
    posts: [...byTopic.map((p) => ({ ...p, meta: { ...p.meta, why: 'topic' } })), ...byRecency.map((p) => ({ ...p, meta: { ...p.meta, why: 'recent' } }))],
    excerpts: excerpts.filter((e) => e.score > 0).slice(0, opts.excerpts),
  };
}

/** retrieve(brand, query, opts): the corpus for one brand and kit, allow-listed, then ranked. */
export async function retrieve(env: Env, brand: { id: string }, query: string, opts: RetrieveOpts & { kit: { facts: FactInput[]; sourceIds: string[] } }): Promise<Retrieved> {
  return rankCorpus(await loadCorpus(env, brand.id, opts.kit), query, opts);
}
