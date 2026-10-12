import type { ApprovedPost, BadgeEmbedData, BadgeStyle } from './types';
import { growthSession } from './session';

/** The embed code for a post's badge: a link to Verify around the badge image (the image route is not built yet). */
export function badgeSnippet(data: BadgeEmbedData, post: ApprovedPost, style: BadgeStyle): string {
  const id = encodeURIComponent(post.id);
  const alt = `Official ${post.brand.name} post, checked on JamJam`;
  return `<a href="${data.verifyUrl}?post=${id}"><img src="${data.imageUrl}/${id}.svg?style=${style}" alt="${alt}"></a>`;
}

export interface BadgeEmbedFlow {
  /** The picked post, or null until the person picks one (nothing is picked for them). */
  post: ApprovedPost | null;
  style: BadgeStyle;
  choosePost: (id: string) => void;
  chooseStyle: (style: BadgeStyle) => void;
  /** Embed code for the picked post and style; null until a post is picked. */
  snippet: string | null;
}

/** Badge-Embed flow state: the post and style picked here, kept in the session so the badge's landing shows them. */
export function useBadgeEmbed(data: BadgeEmbedData): BadgeEmbedFlow {
  const [session, set] = growthSession.use();
  const { postId, style } = session.badge;
  const post = data.posts.find((p) => p.id === postId) ?? null;
  return {
    post,
    style,
    choosePost: (id) => set({ badge: { style, postId: id || null } }),
    chooseStyle: (s) => set({ badge: { postId, style: s } }),
    snippet: post ? badgeSnippet(data, post, style) : null,
  };
}

/** The verified post a visitor arrived at (from a badge): the post picked on Badge-Embed, else the default. */
export function useVisitedPost(posts: ApprovedPost[], defaultId: string): { post: ApprovedPost | undefined; style: BadgeStyle } {
  const [session] = growthSession.use();
  const post = posts.find((p) => p.id === session.badge.postId) ?? posts.find((p) => p.id === defaultId);
  return { post, style: session.badge.style };
}
