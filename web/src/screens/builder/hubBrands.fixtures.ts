// The demo brands the hub screens switch between (component inventory D48: JamJam, aDNA, film.fun, GamersLab, as in
// ui/domain/demoBrands.ts), with what each hub screen needs to name them. Source: canvas
// https://claude.ai/artifact/9aUT9mW2ZHvYsK4SFu1syn, boards Kit-Export and Dashboard (aDNA, adna.network verified) and
// note n-openq.5 (real facts for aDNA and film.fun stay bracketed until their sources are read); issue #50.
import { demoBrands } from '../../ui/domain/demoBrands';

export interface HubBrand {
  id: string;
  name: string;
  /** File-name slug, e.g. "jamjam". */
  slug: string;
  /** Domain as known, bracketed where it is not. */
  domain: string;
  verified: boolean;
}

const domains: Record<string, string> = { jamjam: 'jamjam.tech', adna: 'adna.network', filmfun: 'film.fun', gamerslab: '[GamersLab domain]' };

export const hubBrands: HubBrand[] = demoBrands.map((b) => ({
  id: b.id,
  name: b.name,
  slug: b.id,
  domain: domains[b.id] ?? '[domain]',
  verified: Boolean(b.verified),
}));

/** One value per demo brand, built by `make`. */
export function perBrand<T>(make: (brand: HubBrand) => T): Record<string, T> {
  return Object.fromEntries(hubBrands.map((b) => [b.id, make(b)]));
}
