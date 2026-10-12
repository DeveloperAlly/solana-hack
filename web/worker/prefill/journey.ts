// The Journey screens' data, built from the coverage map (issue #34). Pure: the API loads rows (prefill/load.ts) and
// these functions shape them into the contract in prefill/contract.ts (ReadData for J1-Read, ConfirmData for
// J3-Confirm, the gaps part of GapsVoiceData for J4). Every fact shown is a stored evidence row with its quote and
// the page it came from; nothing here writes a statement of its own about the brand.
import { VOICE_TEMPLATES } from '../../src/screens/build/steps';
import { SECTIONS, type SectionId } from '../kit';
import { usableFact } from '../sources/registry';
import type { ConfirmData, GapsVoiceData, JourneyFact, JourneyFactSource, JourneySource, ReadData } from './contract';
import { compareFacts, coverageMap, factStatus, liveSourceFact, type CoverageFact, type CoverageInput, type CoverageMap, type GapQuestion } from './coverage';
import { fieldById, sectionLabel } from './fields';

/** Where each page of a multi-page source sits in its stored text (spec/db/012 sources.read_meta, from the read step). */
export interface ReadMeta { pages?: { url: string; title: string; start: number; end: number }[]; notes?: string[]; words?: number }
export interface JourneySourceRow { id: string; url: string | null; title: string | null; status: string; error: string | null; kind?: string | null; read_meta?: ReadMeta | null }
/** A run still working on a source (runs.input.sourceId), for its progress. */
export interface JourneyRun { status: string; progress?: { message?: string | null } | null; input?: { sourceId?: unknown } | null }
export interface JourneyInput extends CoverageInput {
  brand: { name: string; website: string | null };
  sources: JourneySourceRow[];
  runs: JourneyRun[];
}

const hostOf = (u: string | null | undefined) => {
  try { return u ? new URL(u.includes('://') ? u : `https://${u}`).hostname.replace(/^www\./, '') : ''; } catch { return ''; }
};
const pathOf = (u: string) => { try { return new URL(u).pathname.replace(/\/+$/, ''); } catch { return ''; } };

/** The page of a source a quote sits on, from its offsets; the source itself when it has one page or no offsets. */
function pageOf(src: JourneySourceRow | undefined, f: Pick<CoverageFact, 'quote_start'>) {
  const pages = src?.read_meta?.pages ?? [];
  const at = f.quote_start;
  return typeof at === 'number' ? pages.find((p) => at >= p.start && at < p.end) : undefined;
}

/** "jamjam.tech · home page" or "jamjam.tech · How it works": the page a fact was read on, linked so anyone can check. */
export function factSource(f: CoverageFact, src: JourneySourceRow | undefined): JourneyFactSource | undefined {
  if (!src) return undefined;
  const page = pageOf(src, f);
  const url = page?.url ?? src.url ?? undefined;
  const host = hostOf(url);
  if (!host) return { label: src.title || 'Text you added' };
  const home = !pathOf(url!);
  const name = home ? 'home page' : (page?.title || src.title || pathOf(url!)).trim();
  return { label: `${host} · ${name}`, url: url! };
}

const NOTE_REVIEW = 'Read from a page you do not control: accept it before it is used.';
const NOTE_FUZZY = 'The quote was matched closely, not exactly: check it against the page.';

export function journeyFact(f: CoverageFact, contested: ReadonlySet<string>, src: JourneySourceRow | undefined, note?: string): JourneyFact {
  const status = factStatus(f, contested);
  const why = note ?? (!usableFact(f) && f.trust === 'third_party' ? NOTE_REVIEW : f.match === 'fuzzy' && !usableFact(f) ? NOTE_FUZZY : undefined);
  const source = factSource(f, src);
  return { id: f.id, section: sectionLabel(f.section), status, statement: f.claim, ...(f.quote ? { quote: f.quote } : {}), ...(source ? { source } : {}), ...(why ? { note: why } : {}) };
}

interface Built { map: CoverageMap; cards: JourneyFact[]; byId: Map<string, CoverageFact>; contested: Set<string> }

/** The fact cards: the best fact for each prefilled question, each side of each open conflict, and, for a kit section
 * no question covers yet, its best usable fact. */
function build(input: JourneyInput): Built {
  const map = coverageMap(input);
  const byId = new Map(input.facts.map((f) => [f.id, f]));
  const src = new Map(input.sources.map((s) => [s.id, s]));
  const contested = new Set(map.questions.flatMap((q) => (q.kind === 'conflict' ? q.factIds : [])));
  const cards = new Map<string, JourneyFact>();
  for (const q of map.questions.filter((x) => x.kind === 'conflict')) {
    for (const side of q.sides ?? []) {
      const f = byId.get(side.ids[0])!;
      const more = side.ids.length > 1 ? ` ${side.ids.length} sources say this.` : '';
      cards.set(f.id, journeyFact(f, contested, src.get(f.source_id ?? ''), `${q.question}${more}`));
    }
  }
  for (const field of map.fields) {
    if (field.id === 'voice.template') continue;
    const first = field.factIds.map((id) => byId.get(id)!).find((f) => !contested.has(f.id));
    if (!first || cards.has(first.id)) continue;
    const others = field.factIds.length - 1;
    const card = journeyFact(first, contested, src.get(first.source_id ?? ''));
    const note = [card.note, others > 0 ? `${others} more ${others === 1 ? 'fact' : 'facts'} from your sources answer "${field.question}"` : `Answers "${field.question}"`].filter(Boolean).join(' ');
    cards.set(first.id, { ...card, note });
  }
  const shownSections = new Set([...cards.values()].map((c) => c.section));
  const usable = input.facts.filter((f) => liveSourceFact(f) && usableFact(f) && !contested.has(f.id)).sort(compareFacts(contested));
  for (const s of Object.keys(SECTIONS) as SectionId[]) {
    if (s === 'voice' || shownSections.has(sectionLabel(s))) continue;
    const f = usable.find((x) => x.section === s);
    if (f) cards.set(f.id, journeyFact(f, contested, src.get(f.source_id ?? '')));
  }
  return { map, cards: [...cards.values()], byId, contested };
}

/**
 * Source rows as J1 lists them, newest read of each link only. A read site lists each page it read with the facts found on it (by quote offsets);
 * pages the reader passed over (robots.txt, another site) are 'skipped'; a source still being read is 'reading', or
 * 'queued' while its run waits for the model's limit; a source that could not be read is 'blocked' with its reason.
 */
export function journeySources(input: Pick<JourneyInput, 'sources' | 'runs' | 'facts'>): JourneySource[] {
  const live = input.facts.filter(liveSourceFact);
  const out: JourneySource[] = [];
  // Reading the same link again makes a new source row (each run keeps the text its quotes were checked against), so
  // only the newest row per link is listed; facts from older reads still count, each against its own text.
  const newest = input.sources.filter((s, i) => !s.url || !input.sources.slice(i + 1).some((t) => t.url === s.url));
  for (const s of newest) {
    const mine = live.filter((f) => f.source_id === s.id);
    if (s.status === 'failed') { out.push({ id: s.id, label: sourceLabel(s.url, s.title, null), status: 'blocked', reason: s.error || 'it could not be read' }); continue; }
    if (s.status !== 'read') {
      const run = input.runs.find((r) => r.input?.sourceId === s.id);
      out.push(run?.status === 'running'
        ? { id: s.id, label: sourceLabel(s.url, s.title, null), status: 'reading' }
        : { id: s.id, label: sourceLabel(s.url, s.title, null), status: 'queued', ...(run?.progress?.message ? { reason: run.progress.message } : {}) });
      continue;
    }
    const pages = s.read_meta?.pages ?? [];
    if (pages.length > 1) {
      const host = hostOf(pages[0].url);
      pages.forEach((p, i) => out.push({ id: `${s.id}:${i}`, label: sourceLabel(p.url, p.title, host), status: 'read', facts: mine.filter((f) => typeof f.quote_start === 'number' && f.quote_start >= p.start && f.quote_start < p.end).length }));
    } else {
      out.push({ id: s.id, label: sourceLabel(s.url, s.title, null), status: 'read', facts: mine.length });
    }
    (s.read_meta?.notes ?? []).forEach((n, i) => {
      // The site reader's notes on pages it passed over (sources/site.ts): "2 page(s) skipped: robots.txt disallows them".
      const m = /^(\d+) (?:linked )?page\(s\) (?:skipped|not read): (.+)$/.exec(n);
      if (m) out.push({ id: `${s.id}:skipped:${i}`, label: `${m[1]} linked ${m[1] === '1' ? 'page' : 'pages'}`, status: 'skipped', reason: m[2] });
    });
  }
  return out;
}

/** A page's list label: the host for a home page or another site, the path for a page on the same site. */
function sourceLabel(url: string | null, title: string | null, sameHost: string | null) {
  const host = hostOf(url);
  if (!host) return title || 'Text you added';
  const path = pathOf(url!);
  if (!path) return host;
  return host === sameHost ? path : `${host}${path}`;
}

/** J1-Read. */
export function readData(input: JourneyInput): ReadData {
  const { map, cards } = build(input);
  return { site: hostOf(input.brand.website) || hostOf(input.sources.find((s) => s.url)?.url) || '', sources: journeySources(input), facts: cards, coverage: map.coverage };
}

export const timeLeft = (minutes: number) => (minutes <= 0 ? 'no questions left' : `about ${Math.ceil(minutes)} ${Math.ceil(minutes) === 1 ? 'minute' : 'minutes'}`);

/**
 * Shown under the cards. The kit drafts 6 sections (kit.ts); the other 11 of the 17 in architecture §4 come later and
 * do not block kit v1. Audit 2026-10-12, owner decision D2 (proposed): show the 6, with the other 11 as "later".
 */
export const DEFERRED_NOTE = 'The other 11 kit sections (values, visual kit, examples and others) come later in Brand › Kit. They do not block kit v1.';

/** J3-Confirm: the cards the owner has not decided yet, the voice card, what is missing, and what is left. */
export function confirmData(input: JourneyInput): ConfirmData {
  const { map, cards, byId, contested } = build(input);
  const facts = cards.filter((c) => !byId.get(c.id)?.decision && c.quote);
  const voiceField = map.fields.find((f) => f.id === 'voice.template')!;
  const src = new Map(input.sources.map((s) => [s.id, s]));
  const words = input.ownedWords;
  let voice: JourneyFact;
  if (voiceField.answer) {
    const t = VOICE_TEMPLATES.find((x) => x.value === voiceField.answer);
    voice = { id: 'voice', section: sectionLabel('voice'), status: 'found', statement: `Your voice: ${t?.label ?? voiceField.answer}.`, note: 'Picked by you.' };
  } else if (voiceField.factIds.length) {
    const f = byId.get(voiceField.factIds[0])!;
    voice = { ...journeyFact(f, contested, src.get(f.source_id ?? '')), status: 'partly', note: "You'll pick the paragraph that sounds right next." };
  } else if (voiceField.status === 'partly') {
    voice = { id: 'voice', section: sectionLabel('voice'), status: 'partly', statement: `Your sources hold ${words} words of your own writing, enough to suggest a voice.`, note: "You'll pick the paragraph that sounds right next." };
  } else {
    voice = { id: 'voice', section: sectionLabel('voice'), status: 'needs-you', statement: 'Your sources do not hold enough of your own writing to suggest a voice yet.', note: "You'll pick from sample paragraphs next." };
  }
  const blocking = map.questions.filter((q) => q.kind !== 'weak' && !q.optional);
  const missingSections = map.sections.filter((s) => s.status === 'needs-you').map((s) => s.title);
  const missing: JourneyFact = blocking.length
    ? {
      id: 'missing',
      section: missingSections.length ? missingSections.join(' · ') : [...new Set(blocking.map((q) => sectionLabel(fieldSection(q))))].join(' · '),
      status: 'needs-you',
      statement: `Nothing in your sources answers ${blocking.length === 1 ? 'this' : 'these'} yet: ${blocking.map((q) => q.question).join(' ')}`,
      note: `${blocking.length} short ${blocking.length === 1 ? 'question' : 'questions'} next.`,
    }
    : { id: 'missing', section: 'Kit', status: 'found', statement: 'Your sources answer every question kit v1 needs.', note: 'No questions left.' };
  return { facts, voice, missing, readinessBase: map.coverage.percent, questionsLeft: map.questionsLeft, timeLeft: timeLeft(map.minutesLeft), deferredNote: DEFERRED_NOTE };
}

/** The kit section a gap question feeds first (its field's first reader), for the missing card's label. */
function fieldSection(q: GapQuestion): string {
  const f = fieldById(q.field);
  return f ? (f.answeredBy[0] ?? '') : 'Kit';
}

/** J4's gap questions (GapsVoiceData without the voice rounds, which the voice step generates), plus the ranked list. */
export type GapsData = Omit<GapsVoiceData, 'voice'> & { questions: GapQuestion[] };

export function gapsData(input: JourneyInput, today: string): GapsData {
  const { map, byId } = build(input);
  const src = new Map(input.sources.map((s) => [s.id, s]));
  const q = (id: string) => fieldById(id)!.question;
  const alt = map.fields.find((f) => f.id === 'alternatives.instead')!;
  const altFacts = alt.factIds.map((id) => byId.get(id)!);
  const labels = [...new Set(altFacts.map((f) => factSource(f, src.get(f.source_id ?? ''))?.label).filter(Boolean))];
  return {
    brandName: input.brand.name,
    alternatives: {
      question: `What do people use instead of ${input.brand.name} today?`,
      hint: altFacts.length ? 'Alternatives your sources mention. Pick, edit or add your own.' : 'Nothing in your sources names one yet. Add your own.',
      options: altFacts.map((f) => f.claim),
      source: labels.length ? `Source: ${labels.join(', ')}.` : 'Source: your own answer.',
    },
    edgeQuestion: q('alternatives.edge'),
    originQuestion: q('origin.why'),
    originNote: `Saved as evidence: "owner answer, ${today}".`,
    questions: map.questions,
  };
}

/** The full map for the Build screen and other components: each field with its best fact card. */
export function coverageData(input: JourneyInput) {
  const { map, byId, contested } = build(input);
  const src = new Map(input.sources.map((s) => [s.id, s]));
  return {
    ...map,
    fields: map.fields.map((f) => {
      const best = f.factIds.map((id) => byId.get(id)!).find((x) => !contested.has(x.id));
      return { ...f, ...(best ? { best: journeyFact(best, contested, src.get(best.source_id ?? '')) } : {}) };
    }),
  };
}
