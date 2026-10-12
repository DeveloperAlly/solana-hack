import type { ReactNode } from 'react';
import { demoBrands } from '../../ui/domain/demoBrands';
import { SoonHubFrame } from '../../ui/domain/SoonHubFrame';
import type { SoonPageHeaderProps } from '../../ui/domain/SoonPageHeader';
import { defaultBrandId, useSoonSession } from './useSoonSession';

export interface SoonPageProps {
  header: SoonPageHeaderProps;
  nav?: ReactNode;
  children?: ReactNode;
}

/**
 * This page's hub frame: the brand chosen in the switcher (or on Brand-Switcher) lives in the session, so it carries
 * across every screen, and brands added on Brand-Switcher appear in the switcher.
 */
export function SoonPage({ header, nav, children }: SoonPageProps) {
  const [session, set] = useSoonSession();
  const brands = [...demoBrands, ...(session.addedBrands ?? []).map((b) => ({ id: b.id, name: b.name }))];
  return (
    <SoonHubFrame header={header} nav={nav} brands={brands} brandId={session.brandId ?? defaultBrandId} onBrandChange={(brandId) => set({ brandId })}>
      {children}
    </SoonHubFrame>
  );
}
