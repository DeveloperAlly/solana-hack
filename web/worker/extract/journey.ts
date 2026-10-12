// What the onboarding journey shows for stored facts (issue #64 feeding PR #75, branch ui/48-journey; issue #34 serves
// it as ReadData / ConfirmData). PR #75 defines the shape the screens take: JourneyFact {id, section, status,
// statement, quote?, source?: {label, url?}, note?} in web/src/ui/domain/JourneyFactCard.tsx, with status 'found' |
// 'partly' | 'needs-you' (EvidenceChip.tsx). The Worker never imports UI code, so this module returns objects with
// exactly those field names and meanings, and the API passes them through unchanged: one shape, no second model of a
// fact. Pure functions only: the caller reads the rows (evidence, sources, fact_conflicts; spec/db/001, 009, 011).
import { GATES, isSection, SECTIONS } from '../kit';

export type FactStatus = 'found' | 'partly' | 'needs-you';
/** Structurally the same as PR #75's JourneyFact. */
export interface FactView {
  id: string;
  section: string;
  status: FactStatus;
  statement: string;
  quote?: string;
  source?: { label: string; url?: string };
  note?: string;
}

/** A stored evidence row, as far as the journey needs it (spec/db/001, 009, 011). */
export interface EvidenceRow {
  id: string;
  section: string;
  claim: string;
  quote: string | null;
  source_id: string | null;
  review_status: string;
  trust?: string | null;
  match?: string | null;
  page_url?: string | null;
  page_title?: string | null;
}
export interface SourceRow { id: string; url: string | null; title: string | null }
export interface ConflictRow { id: string; slot: string; evidence_ids: string[]; question: string; status: string }
/** An open conflict as the journey shows it: one question, and every side with its own quote and page. */
export interface ConflictView { question: FactView; sides: FactView[] }

/** Section label for an owner answer saved under an interview step that is not a kit section (PR #75 journey.fixtures.ts ownerAnswer). */
export const OWNER_ANSWER_SECTION = 'Owner answer';

/** "Positioning · Gate 2": the kit section title, with its gate when it has one (kit.ts SECTIONS and GATES; the label
 * form PR #75's JourneyFact documents). Anything else is returned as given. */
export function sectionLabel(section: string): string {
  if (!isSection(section)) return section;
  const gate = (GATES as readonly string[]).indexOf(section);
  return gate < 0 ? SECTIONS[section].title : `${SECTIONS[section].title} · Gate ${gate + 1}`;
}

/**
 * "jamjam.tech · home page" or "jamjam.tech · Pricing": host, then the page (its title, or "home page" at the root),
 * as PR #75's JourneyFactSource labels it. The url is passed on only when it is an http(s) address, because the screen
 * renders it as a link.
 */
export function sourceLabel(url: string | null | undefined, title: string | null | undefined): { label: string; url?: string } | undefined {
  const name = title?.trim();
  if (!url) return name ? { label: name } : undefined;
  let u: URL;
  try { u = new URL(url); } catch { return { label: name || url }; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { label: name || u.hostname || url };
  const host = u.hostname.replace(/^www\./, '');
  const root = u.pathname.replace(/\/+$/, '') === '' && !u.search;
  return { label: `${host} · ${root ? 'home page' : name || u.pathname}`, url };
}

/** The ids of every fact in an open conflict: pass this to factView, so those facts show as 'needs-you'. */
export function openConflictIds(conflicts: ConflictRow[]): Set<string> {
  return new Set(conflicts.filter((c) => c.status === 'open').flatMap((c) => c.evidence_ids));
}

/**
 * One stored fact as the journey shows it, or null for a rejected fact (not shown). Status:
 * - 'needs-you' while the fact is a side of an open conflict (backlog B3a: the owner decides);
 * - 'found' for the owner's own answer, and for a quote that matched the source exactly and passed the support check
 *   (match 'exact' is set only by extract_facts, which saves supported facts only); a third-party fact says it waits
 *   for the owner;
 * - 'partly' for a passage located fuzzily (the model's quote was a near miss), and for an older fact that passed the
 *   quote check but never the support check, or was never quoted (match empty), each with a note saying so.
 */
export function factView(e: EvidenceRow, sources: Map<string, SourceRow>, conflicted: Set<string>): FactView | null {
  if (e.review_status === 'rejected') return null;
  const answer = e.trust === 'owner_answer';
  const src = e.source_id ? sources.get(e.source_id) : undefined;
  const source = answer ? undefined : sourceLabel(e.page_url ?? src?.url, e.page_title ?? src?.title);
  const status: FactStatus = conflicted.has(e.id) ? 'needs-you' : answer || e.match === 'exact' ? 'found' : 'partly';
  let note: string | undefined;
  if (status === 'needs-you') note = 'Another source says something different. You choose which is right.';
  else if (answer) note = 'Your own answer.';
  else if (e.match === 'fuzzy') note = "The model's quote was not word for word, so this is the closest passage on the page. Check it.";
  else if (!e.match) note = e.quote ? 'The quote is on the page, but whether it backs this fact has not been checked.' : 'Not quoted from any page.';
  else if (e.trust === 'third_party') note = 'From a site you do not control. It waits for you to accept it.';
  const section = answer && !isSection(e.section) ? OWNER_ANSWER_SECTION : sectionLabel(e.section);
  return { id: e.id, section, status, statement: e.claim, ...(e.quote ? { quote: e.quote } : {}), ...(source ? { source } : {}), ...(note ? { note } : {}) };
}

/**
 * An open conflict as the journey shows it: one 'needs-you' item carrying the question, and every side as a
 * 'needs-you' fact with its own quote and source, so the owner sees the passages that disagree. A side the owner
 * already rejected is left out; the question stays until the conflict is resolved (resolve_fact_conflict, spec/db/011).
 * Null when the conflict is resolved, or has no side left to show.
 */
export function conflictView(c: ConflictRow, facts: EvidenceRow[], sources: Map<string, SourceRow>): ConflictView | null {
  if (c.status !== 'open') return null;
  const ids = new Set(c.evidence_ids);
  const sides = facts.filter((f) => ids.has(f.id)).map((f) => factView(f, sources, ids)).filter((f): f is FactView => f !== null);
  if (!sides.length) return null;
  const sections = [...new Set(facts.filter((f) => ids.has(f.id) && f.review_status !== 'rejected').map((f) => f.section))];
  const section = sections.length === 1 ? sectionLabel(sections[0]) : sections.map((s) => (isSection(s) ? SECTIONS[s].title : s)).join(' · ');
  return { question: { id: c.id, section, status: 'needs-you', statement: c.question, note: 'These passages disagree. Nothing is picked for you.' }, sides };
}

/**
 * Every stored fact for the journey, each shown once: facts not in an open conflict as `facts` (input order kept),
 * and each open conflict as one question with its sides in `conflicts`.
 */
export function journeyFacts(evidence: EvidenceRow[], sources: Map<string, SourceRow>, conflicts: ConflictRow[]): { facts: FactView[]; conflicts: ConflictView[] } {
  const views = conflicts.map((c) => conflictView(c, evidence, sources)).filter((v): v is ConflictView => v !== null);
  const asked = new Set(views.flatMap((v) => v.sides.map((s) => s.id)));
  const open = openConflictIds(conflicts);
  const facts = evidence.filter((e) => !asked.has(e.id)).map((e) => factView(e, sources, open)).filter((f): f is FactView => f !== null);
  return { facts, conflicts: views };
}
