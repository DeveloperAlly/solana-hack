// Which brand a public page belongs to (Codex review on PR 111). A public page (Invite-Accept, Referral-Landing,
// Verify-Badge-Landing, Tip-Sheet, Event-Rating) opened from a brand screen carries `?brand=` (paths.ts fromBrand), and
// shows that brand's data and reads and writes that brand's session, whichever brand is active. Without `?brand=` it is
// a standalone visit: its neutral default data, and a session of its own that no brand's screens read.
import type { Store } from '../../lib/createStore';
import { useBrandCatalog } from '../../flows/brand/brandCatalog';
import { loopDataFor } from '../loop/fixtures';
import type { GrowBrandData } from './brandData';
import { useGrowthParam } from './paths';
import { growthSession, type GrowthSession } from './session';

/** The session key of a standalone public visit: no brand screen reads it, so nothing it does lands on a brand. */
export const standaloneVisit = 'standalone-visit';

export interface LinkedBrand {
  id: string;
  name: string;
  grow: GrowBrandData;
}

/** No `?brand=`; a known brand with its data; or an id no brand has (the page says so, never another brand's data). */
export type LinkedBrandLookup = { kind: 'standalone' } | { kind: 'found'; brand: LinkedBrand } | { kind: 'unknown'; id: string };

/** The brand this public page was opened for, from `?brand=`. */
export function useLinkedBrand(): LinkedBrandLookup {
  const id = useGrowthParam('brand');
  const catalog = useBrandCatalog();
  if (!id) return { kind: 'standalone' };
  const name = catalog.brands.find((b) => b.id === id)?.name;
  const data = loopDataFor(id);
  if (!name || !data) return { kind: 'unknown', id };
  return { kind: 'found', brand: { id, name, grow: data.grow } };
}

/** The session a public page reads and writes: the linked brand's (`?brand=`), else the standalone visit's own. */
export function usePublicSession(): Store<GrowthSession> {
  const id = useGrowthParam('brand');
  return growthSession.forBrand(id ?? standaloneVisit);
}
