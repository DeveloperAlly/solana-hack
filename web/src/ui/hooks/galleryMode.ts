import { createContext, useContext } from 'react';

/**
 * True while a screen renders inside the /screens gallery (GalleryScreen provides it). Shells and frames read it and
 * swap every auth or network action (sign out, and anything else that leaves the page or calls a service) for an
 * inert one, so a gallery screen can never sign a real session out or reach the backend (issue #46; Codex review on
 * PR #79). A page frame built on L1 AppShell or L11 AppFrame gets this without doing anything.
 */
export const GalleryModeContext = createContext(false);

export function useGalleryMode(): boolean {
  return useContext(GalleryModeContext);
}
