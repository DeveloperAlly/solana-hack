// Pure views over a brand event (Events, Event-Detail, Grow-Home): plan readiness, item status from its drafts, and
// the one-line labels the boards print. Item status always comes from the linked drafts (ordinary drafts, ./drafts.ts).
import { afterPhases, eventTiming, planPhases, type BrandEvent, type EventPlanItem, type EventTiming, type PlanPhase } from '../../domain/event';
import type { Post } from '../../domain/post';
import type { BadgeTone } from '../../ui/primitives/Badge';
import type { ArtboardName } from '../../config/artboards';
import { draftStatus, draftStatusLabel, type DraftStatus } from './drafts';

/** "Thu 16 Oct" from "2026-10-16T18:00" (the boards' date format; read as a local date, never shifted). */
export function eventDay(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** "18:00" from "2026-10-16T18:00". */
export const eventTime = (iso: string): string => iso.slice(11, 16);

const isReady = (s: DraftStatus) => s === 'published' || s === 'approved';

export interface PlanReadiness {
  ready: number;
  planned: number;
}

/** Posts ready (approved or published) of the posts the plan plans. */
export function planReadiness(event: BrandEvent, drafts: Map<string, Post>, brainVersion: string): PlanReadiness {
  const posts = event.plan.filter((i) => i.kind === 'posts');
  const ready = posts.flatMap((i) => i.draftIds).filter((id) => {
    const d = drafts.get(id);
    return d ? isReady(draftStatus(d, brainVersion)) : false;
  }).length;
  return { ready, planned: posts.reduce((n, i) => n + Math.max(i.posts, i.draftIds.length), 0) };
}

export interface PlanItemView {
  id: string;
  status: { label: string; tone?: BadgeTone };
  brief: string;
  /** A link to where the item is worked on, or the action that drafts it. */
  action?: { label: string; artboard: ArtboardName } | { label: string; draft: true };
}

/** The worst status among an item's drafts decides it: blocked, then needs you, then approved, then published. */
const statusOrder: DraftStatus[] = ['blocked', 'needs-you', 'approved', 'published'];

function postsItem(item: EventPlanItem, drafts: Map<string, Post>, brainVersion: string, timing: EventTiming): PlanItemView {
  const statuses = item.draftIds.map((id) => drafts.get(id)).filter((d): d is Post => Boolean(d)).map((d) => draftStatus(d, brainVersion));
  const waits = afterPhases.includes(item.phase) && timing !== 'after';
  if (statuses.length === 0 && waits) return { id: item.id, brief: item.brief, status: { label: 'After the event' }, action: { label: 'Set up', artboard: 'Media-Composer' } };
  if (statuses.length === 0) return { id: item.id, brief: item.brief, status: { label: 'Not drafted' }, action: { label: `Draft ${item.posts === 1 ? 'the post' : `${item.posts} posts`}`, draft: true } };
  const worst = statusOrder.find((s) => statuses.includes(s))!;
  const action = worst === 'published' ? { label: 'Post', artboard: 'Post-Detail' as const } : { label: 'Review', artboard: 'Draft-Review' as const };
  const count = statuses.length > 1 ? ` · ${statuses.filter(isReady).length} of ${statuses.length} ready` : '';
  return { id: item.id, brief: item.brief, status: { ...draftStatusLabel[worst], label: draftStatusLabel[worst].label + count }, action };
}

/** One plan item as Event-Detail shows it. */
export function planItemView(item: EventPlanItem, drafts: Map<string, Post>, brainVersion: string, timing: EventTiming): PlanItemView {
  if (item.kind === 'posts') return postsItem(item, drafts, brainVersion, timing);
  if (item.kind === 'ambassadors') return { id: item.id, brief: item.brief, status: { label: 'Ambassadors' }, action: { label: 'Brief', artboard: 'Dashboard' } };
  return { id: item.id, brief: item.brief, status: { label: timing === 'after' ? 'Follow up now' : 'After the event' }, action: { label: 'Leads', artboard: 'Leads' } };
}

export interface PlanPhaseView {
  phase: PlanPhase;
  title: string;
  timing: string;
  items: PlanItemView[];
}

/** The plan grouped by phase, in time order, with each item's view. */
export function planByPhase(event: BrandEvent, drafts: Map<string, Post>, brainVersion: string, today: string): PlanPhaseView[] {
  const timing = eventTiming(event, today);
  return planPhases
    .map((p) => {
      const items = event.plan.filter((i) => i.phase === p.id);
      return { phase: p.id, title: p.label, timing: [...new Set(items.map((i) => i.timing))].join(' · '), items: items.map((i) => planItemView(i, drafts, brainVersion, timing)) };
    })
    .filter((p) => p.items.length > 0);
}

/** "3 going" from the ambassadors going, or "Not asked yet". */
export function ambassadorsLabel(event: BrandEvent): string {
  const n = event.going.filter((p) => p.role === 'ambassador').length;
  return n ? `${n} going` : 'Not asked yet';
}

/** "Singapore · Luma" / "Melbourne · Added by hand". */
export function sourceLine(event: BrandEvent): string {
  return `${event.place} · ${event.source.kind === 'luma' ? 'Luma' : 'Added by hand'}`;
}
