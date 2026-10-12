import { createElement, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ComingSoonFlag } from '../../ui/domain/ComingSoonFlag';
import type { AmbNavItem } from '../../ui/domain/AmbShell';
import { ambRoutes, ambSteps, pageRoutes, type AmbRouteKey, type AmbStep } from './routes';
import type { Device } from './types';

export type AmbNavId = 'campaigns' | 'posts' | 'earnings';

/**
 * The ambassador flow (issue #53): step order, next and back, the shell's nav, and navigation. Every Ambassador screen
 * calls this; none writes a path. Steps: campaigns → detail → generate → publish → status (routes.ts).
 */
export function useAmbassadorFlow(device: Device) {
  const navigate = useNavigate();
  return useMemo(() => {
    const paths = ambRoutes[device];
    const at = (step: AmbStep, offset: number) => paths[ambSteps[Math.min(ambSteps.length - 1, Math.max(0, ambSteps.indexOf(step) + offset))]];
    // Canvas nav: "My posts" and "Earnings" both open the paid status board (Amb-5b, M-5).
    const nav: AmbNavItem[] = [
      { id: 'campaigns', label: 'Campaigns', href: paths.campaigns },
      { id: 'posts', label: 'My posts', href: paths.paid },
      { id: 'earnings', label: 'Earnings', href: paths.paid },
    ];
    return {
      device,
      paths,
      pages: pageRoutes,
      next: (step: AmbStep) => at(step, 1),
      back: (step: AmbStep) => at(step, -1),
      go: (to: AmbRouteKey) => {
        const path = paths[to];
        if (path) navigate(path);
      },
      /** Props every screen passes to AmbShell. */
      shell: { device, nav, homeHref: pageRoutes.home, signInHref: pageRoutes.signIn, flag: createElement(ComingSoonFlag, { tag: 'STRETCH' }) },
    };
  }, [device, navigate]);
}

export type AmbassadorFlow = ReturnType<typeof useAmbassadorFlow>;
