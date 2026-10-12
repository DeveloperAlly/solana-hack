import { useCallback } from 'react';
import type { ArtboardName } from '../../config/artboards';
import { useScreenHref } from '../../gallery/screenPath';
import { useGalleryMode } from './galleryMode';

/** The canvas board for each public nav path (config/routes.ts `publicNav`, the logo's "/" and the signed-in "/home"). */
const publicBoards: Record<string, ArtboardName> = { '/': 'Main', '/verify': 'Verify-1-Match', '/ledger': 'Ledger', '/sign-in': 'Onboard-1-SignIn', '/home': 'Today' };

/**
 * Maps a public nav path to its link target. In the gallery each path with a canvas board opens that board's typed
 * screen path (keeping the theme), so a public screen's nav never leaves the gallery (Codex review on PR #102);
 * outside the gallery, and for a path with no board, the live route.
 */
export function usePublicNavHref(): (path: string) => string {
  const gallery = useGalleryMode();
  const href = useScreenHref();
  return useCallback((path: string) => (gallery && publicBoards[path] ? href(publicBoards[path]) : path), [gallery, href]);
}
