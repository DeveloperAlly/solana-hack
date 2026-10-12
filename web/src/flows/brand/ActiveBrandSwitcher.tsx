import { BrandSwitcher } from '../../ui/domain/BrandSwitcher';
import { useActiveBrandId } from './activeBrand';
import { useBrandCatalog } from './brandCatalog';

/**
 * The D48 brand switcher bound to the app-wide active brand and the brand catalog (demo brands plus brands added this
 * session): the one every page frame puts in the shell's brand slot.
 */
export function ActiveBrandSwitcher() {
  const [id, select] = useActiveBrandId();
  return <BrandSwitcher brands={useBrandCatalog().brands} currentId={id} onSelect={select} />;
}
