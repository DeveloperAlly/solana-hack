// Posts registered on Solana this session (Draft-Review "Register on Solana"). Registration is public: anyone can check
// any brand's registered post, so this is one store for every brand, not a brand-scoped one. Public Verify matches
// against it, and each brand's Verify-Home lists its own (filtered by brand id): one record, two views.
// Browser session only. INTEGRATION: POST /api/posts/:id/register (web/worker/posts.ts registerPost) writes the
// registrations row; GET /api/ledger and POST /api/verify read it.
import { createStore } from '../../lib/createStore';
import type { ApprovedPost } from '../../screens/public-next/types';

const store = createStore<{ posts: ApprovedPost[] }>({ posts: [] });

/** Clears this session's registrations (tests). */
export const resetRegisteredPosts = store.reset;

/** Registers a post once: a post already registered keeps its first record (a registered post cannot change). */
export function registerPost(post: ApprovedPost) {
  const { posts } = store.read();
  if (posts.some((p) => p.id === post.id)) return;
  store.set({ posts: [post, ...posts] });
}

/** Every post registered this session, newest first; with `brandId`, only that brand's. */
export function useRegisteredPosts(brandId?: string): ApprovedPost[] {
  const [{ posts }] = store.use();
  if (!brandId) return posts;
  return posts.filter((p) => p.brand.id === brandId);
}
