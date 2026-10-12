import { useState, type ReactNode } from 'react';
import { Container, Stack } from '../primitives';
import { AppShell } from '../shells/AppShell';
import { BrandSwitcher } from './BrandSwitcher';
import { demoBrands } from './demoBrands';
import { SoonPageHeader, type SoonPageHeaderProps } from './SoonPageHeader';

export interface SoonHubFrameProps {
  header: SoonPageHeaderProps;
  /** Section nav under the header, e.g. the Settings tabs. */
  nav?: ReactNode;
  /** Brand selected in the switcher at first render (a demo fixture id). */
  brandId?: string;
  /** Renders inside another page (workbench): no second main landmark or skip link; the brand name keeps the preview nav's name unique. */
  preview?: boolean;
  children?: ReactNode;
}

/**
 * Hub page frame for drawn-not-built screens: L1 AppShell with the D48 brand switcher (local state over the demo
 * brands), the page header with its Coming soon flag, an optional section nav, then the body.
 */
export function SoonHubFrame({ header, nav, brandId = 'jamjam', preview = false, children }: SoonHubFrameProps) {
  const [brand, setBrand] = useState(brandId);
  return (
    <AppShell preview={preview} brandName={preview ? demoBrands.find((b) => b.id === brand)?.name : undefined} brandSlot={<BrandSwitcher brands={demoBrands} currentId={brand} onSelect={setBrand} />}>
      <Container width="app">
        <Stack gap={6}>
          <SoonPageHeader {...header} />
          {nav}
          {children}
        </Stack>
      </Container>
    </AppShell>
  );
}
