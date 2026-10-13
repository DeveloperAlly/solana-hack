import type { ApprovedPost, BadgeEmbedData, BadgeStyle } from './types';
import { growthSession } from './session';
import { usePublicSession } from './linkedBrand';
import { useGrowthParam } from './paths';

/** Escapes text for an HTML attribute value, so a brand name with a quote or angle bracket cannot break the snippet. */
function attr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** The embed code for a post's badge: a link to Verify around the badge image (the image route is not built yet). */
export function badgeSnippet(data: BadgeEmbedData, post: ApprovedPost, style: BadgeStyle): string {
  const id = encodeURIComponent(post.id);
  const alt = attr(`Official ${post.brand.name} post, checked on JamJam`);
  return `<a href="${attr(`${data.verifyUrl}?post=${id}`)}"><img src="${attr(`${data.imageUrl}/${id}.svg?style=${style}`)}" alt="${alt}"></a>`;
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

/**
 * The verified post a visitor arrived at: the one the badge link names (`?post=`; undefined when no such post is
 * registered), else the post picked on Badge-Embed, else the default. The style is the linked brand's pick
 * (linkedBrand.ts), the outline badge on a standalone visit.
 */
export function useVisitedPost(posts: ApprovedPost[], defaultId: string): { post: ApprovedPost | undefined; style: BadgeStyle } {
  const [session] = usePublicSession().use();
  const linked = useGrowthParam('post');
  const byId = (id: string | null) => posts.find((p) => p.id === id);
  const post = linked ? byId(linked) : (byId(session.badge.postId) ?? byId(defaultId));
  return { post, style: session.badge.style };
}
