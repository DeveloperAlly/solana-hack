import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import type { NavTarget } from '../../config/nav';
import { screenPath } from '../../gallery/screenPath';
import { useGalleryMode } from './galleryMode';

/**
 * Resolves a nav target (config/nav.ts) to an href. Inside the gallery every target is its artboard's typed screen
 * path, keeping the gallery theme, so a composed screen's nav stays in the gallery (issue #46). Outside the gallery
 * the live route is used where the product has one; a step that exists only as screens on sample data opens its
 * gallery screen (ADR-013 decision 7: the UI proof of concept is complete before each step is integrated).
 */
export function useNavHref(): (target: NavTarget) => string {
  const gallery = useGalleryMode();
  const [params] = useSearchParams();
  return useCallback(
    (target: NavTarget) => (!gallery && target.live ? target.live : screenPath(target.artboard, undefined, params)),
    [gallery, params],
  );
}
