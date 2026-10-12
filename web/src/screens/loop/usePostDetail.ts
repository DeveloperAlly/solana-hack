import { useState } from 'react';
import { approvalState } from '../../domain/post';
import { checksGate } from '../../domain/queue';
import { useLoop } from '../../flows/loop/useLoop';
import type { PostDetailData } from './types';

/**
 * Post-Detail's flow: which post is open (the picker), and that post under the current Brain from the shared loop
 * state, so an approval goes stale here as soon as a rule change elsewhere bumps the Brain.
 */
export function usePostDetail(data: PostDetailData) {
  const loop = useLoop(data);
  const [postId, setPostId] = useState(data.posts[0]?.id ?? '');
  const post = data.posts.find((p) => p.id === postId) ?? data.posts[0];
  return {
    brain: loop.brain,
    post,
    postId,
    setPostId,
    options: data.posts.map((p) => ({ value: p.id, label: p.name })),
    approval: post ? approvalState(post, loop.brain.version) : 'none',
    checks: post ? checksGate(post.checks) : undefined,
  };
}
