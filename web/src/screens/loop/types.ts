// Data shapes for the loop screens (ADR-012, PR #86; issue #90 contracts). Domain types live in src/domain, shared
// with Create, Grow and Learn; these add only what one screen shows.
import type { ArtboardName } from '../../config/artboards';
import type { LoopStageId } from '../../config/nav';
import type { LoopStepState } from '../../domain/loop';
import type { Post } from '../../domain/post';
import type { QueueItem } from '../../domain/queue';
import type { LoopBase } from '../../flows/loop/useLoop';
import type { Quest } from '../../domain/quest';

/** Where the brand is on one loop step (Today's strip). */
export interface LoopStepStatus {
  stage: LoopStageId;
  state: LoopStepState;
  detail: string;
  link: { label: string; artboard: ArtboardName };
}

export interface TodayData extends LoopBase {
  /** "Tuesday" (client: today's weekday). */
  weekday: string;
  /** Status line under the title. */
  status: string;
  loop: LoopStepStatus[];
  /** Why the next step has not started, e.g. "Learn starts after 14 days of results". */
  loopNote: string;
  queue: QueueItem[];
  /** Quests whose submissions can reach the queue (ambassador posts with a questId). */
  quests?: Quest[];
  done: string[];
  /** The latest learn finding; absent until Learn has results. */
  learned?: string;
  next: { when: string; what: string }[];
  /** Badge traffic this week; absent until the badge is on the brand's site. */
  proof?: string;
}

export interface PostDetailData extends LoopBase {
  posts: Post[];
}

export interface LearnRulesData extends LoopBase {
  /** Days of results so far, and how many Learn needs before it suggests anything. */
  collecting: { days: number; needed: number };
}

export interface RegisteredRow {
  id: string;
  kind: 'kit' | 'post' | 'ambassador';
  what: string;
  when: string;
  approver: string;
  record: ArtboardName;
}

export interface VerifyHomeData {
  brandName: string;
  kpis: { label: string; value: string; sub: string }[];
  registered: RegisteredRow[];
  noMatch: { id: string; text: string; when: string }[];
}
