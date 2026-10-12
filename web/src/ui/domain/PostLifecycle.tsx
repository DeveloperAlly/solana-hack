import type { ReactNode } from 'react';
import { lifecycleSteps, type LifecycleStepId, type Post } from '../../domain/post';
import { StatusTimeline } from '../composites/StatusTimeline';
import styles from './PostLifecycle.module.css';

export interface PostLifecycleProps {
  post: Post;
  /** The current Brain version: an unpublished approval made under an older one is stale. */
  brainVersion: string;
  /** A link or button after a step's detail, e.g. "check it" on Verified. */
  actions?: Partial<Record<LifecycleStepId, ReactNode>>;
  /** `full` (default) adds the line on what goes on Solana; `compact` is the strip alone, for post cards. */
  variant?: 'full' | 'compact';
  /** Accessible name of the strip (default "This post, through the loop"). */
  label?: string;
}

/**
 * D70 PostLifecycle: one post through the whole loop (ADR-012 decision 3): drafted, approved, published, verified,
 * amplified, results. Each step is done, current, failed, blocked (an approval gone stale) or to do, derived from
 * the Post type (domain/post.ts), drawn with C9 StatusTimeline. Every post card and Post-Detail render this one.
 */
export function PostLifecycle({ post, brainVersion, actions = {}, variant = 'full', label = 'This post, through the loop' }: PostLifecycleProps) {
  const steps = lifecycleSteps(post, brainVersion).map((s) => ({ label: s.label, state: s.state, note: s.detail, action: actions[s.id] }));
  return (
    <div className={styles.root}>
      <StatusTimeline steps={steps} label={label} />
      {variant === 'full' && <p className={styles.note}>Approval is recorded in JamJam. Registration is what goes on Solana: a hash and ids, never the text.</p>}
    </div>
  );
}
