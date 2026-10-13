import type { BrandOption } from './BrandSwitcher';

/** A demo brand with the domain it registers under (bracketed where no source gives one). */
export interface DemoBrand extends BrandOption {
  domain: string;
}

/** Demo fixture brands named in the component inventory (D48): JamJam, aDNA, film.fun, GamersLab. */
export const demoBrands: DemoBrand[] = [
  { id: 'jamjam', name: 'JamJam', verified: true, domain: 'jamjam.tech' },
  { id: 'adna', name: 'aDNA', verified: true, domain: 'adna.network' },
  { id: 'filmfun', name: 'film.fun', domain: '[film.fun domain]' },
  { id: 'gamerslab', name: 'GamersLab', domain: '[gamerslab domain]' },
];
