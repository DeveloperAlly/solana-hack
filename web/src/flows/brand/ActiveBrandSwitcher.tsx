import { BrandSwitcher, type BrandOption } from '../../ui/domain/BrandSwitcher';
import { demoBrands } from '../../ui/domain/demoBrands';
import { useActiveBrandId } from './activeBrand';

export interface ActiveBrandSwitcherProps {
  /** Brands added this session (Coming soon's Brand-Switcher), after the demo brands. */
  added?: BrandOption[];
}

/** The D48 brand switcher bound to the app-wide active brand: the one every page frame puts in the shell's brand slot. */
export function ActiveBrandSwitcher({ added = [] }: ActiveBrandSwitcherProps) {
  const [id, select] = useActiveBrandId();
  return <BrandSwitcher brands={[...demoBrands, ...added]} currentId={id} onSelect={select} />;
}
