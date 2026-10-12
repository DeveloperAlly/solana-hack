import { useNavigate } from 'react-router';
import { useLiveBrands } from '../../lib/liveBrands';
import { BrandSwitcher } from './BrandSwitcher';

/** Account-owned brands only; sample brands never enter live actions (issue 114). */
export function LiveBrandSwitcher() {
  const catalog = useLiveBrands();
  const navigate = useNavigate();
  return <BrandSwitcher brands={catalog.brands} currentId={catalog.id ?? ''} onSelect={catalog.select} onAdd={() => navigate('/build/basics?new=1')} />;
}
