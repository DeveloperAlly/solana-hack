import { useState, type ReactNode } from 'react';
import { Container, Stack } from '../primitives';
import { AppShell } from '../shells/AppShell';
import { BrandSwitcher, type BrandOption } from './BrandSwitcher';
import { demoBrands } from './demoBrands';
import { SoonPageHeader, type SoonPageHeaderProps } from './SoonPageHeader';

export interface SoonHubFrameProps {
  header: SoonPageHeaderProps;
  /** Section nav under the header, e.g. the Settings tabs. */
  nav?: ReactNode;
  /** The account's brands for the switcher (defaults to the demo brands). */
  brands?: BrandOption[];
  /** Selected brand. With onBrandChange the frame is controlled; without it, this is the first selection. */
  brandId?: string;
  onBrandChange?: (id: string) => void;
  /** Renders inside another page (workbench): no second main landmark or skip link; the brand name keeps the preview nav's name unique. */
  preview?: boolean;
  children?: ReactNode;
}

/**
 * Hub page frame for drawn-not-built screens: L1 AppShell with the D48 brand switcher, the page header with its
 * Coming soon flag, an optional section nav, then the body. The brand is controlled by the caller when it passes
 * onBrandChange (so a choice carries across screens), otherwise kept in local state.
 */
export function SoonHubFrame({ header, nav, brands = demoBrands, brandId = 'jamjam', onBrandChange, preview = false, children }: SoonHubFrameProps) {
  const [local, setLocal] = useState(brandId);
  const brand = onBrandChange ? brandId : local;
  const select = onBrandChange ?? setLocal;
  return (
    <AppShell preview={preview} brandName={preview ? brands.find((b) => b.id === brand)?.name : undefined} brandSlot={<BrandSwitcher brands={brands} currentId={brand} onSelect={select} />}>
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
