import { createElement, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useScreenHref } from '../../gallery/screenPath';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import type { AmbNavItem } from '../../ui/domain/AmbShell';
import { ambRoutes, ambSteps, pageRoutes, verifyMatch, type AmbRouteKey, type AmbStep, type ScreenTarget } from './routes';
import { ambSession, useAmbSession } from './session';
import type { Device } from './types';

export type AmbNavId = 'campaigns' | 'posts' | 'earnings';
type Paths = Record<Exclude<AmbRouteKey, 'budget'>, string> & { budget?: string };

/**
 * The ambassador flow (issue #53): step order, next and back, the shell's nav, and navigation. Every Ambassador screen
 * calls this; none writes a path. It also carries the choices made so far (session.ts) to every later screen.
 * Steps: campaigns → detail → generate → publish → status (routes.ts). Hrefs come from
 * the gallery's useScreenHref, so the gallery theme survives every step.
 */
export function useAmbassadorFlow(device: Device) {
  const navigate = useNavigate();
  const screenHref = useScreenHref();
  const session = useAmbSession();
  return useMemo(() => {
    const href = (t: ScreenTarget) => screenHref(t.artboard, t.state);
    const targets = ambRoutes[device];
    const paths = Object.fromEntries(Object.entries(targets).map(([k, t]) => [k, href(t)])) as Paths;
    const at = (step: AmbStep, offset: number) => paths[ambSteps[Math.min(ambSteps.length - 1, Math.max(0, ambSteps.indexOf(step) + offset))]];
    // Canvas nav: "My posts" and "Earnings" both open the paid status board (Amb-5b, M-5).
    const nav: AmbNavItem[] = [
      { id: 'campaigns', label: 'Campaigns', href: paths.campaigns },
      { id: 'posts', label: 'My posts', href: paths.paid },
      { id: 'earnings', label: 'Earnings', href: paths.paid },
    ];
    return {
      device,
      /** What the ambassador chose on earlier screens (session.ts); fixtures fill only what is not chosen yet. */
      session,
      remember: ambSession.update,
      paths,
      pages: { ...pageRoutes, verifyMatch: href(verifyMatch) },
      next: (step: AmbStep) => at(step, 1),
      back: (step: AmbStep) => at(step, -1),
      go: (to: AmbRouteKey) => {
        const path = paths[to];
        if (path) navigate(path);
      },
      /** Props every screen passes to AmbShell. */
      shell: { device, nav, homeHref: pageRoutes.home, signInHref: pageRoutes.signIn, flag: createElement(ComingSoonFlag, { tag: 'STRETCH' }) },
    };
  }, [device, navigate, screenHref, session]);
}

export type AmbassadorFlow = ReturnType<typeof useAmbassadorFlow>;
