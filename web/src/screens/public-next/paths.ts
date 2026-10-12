// Route paths for the "Verify + ledger" page (issue #49). Every link between these screens comes from here.
// Each artboard opens at its gallery route /screens/<Artboard> (issue #45); the live /verify and /ledger stay unchanged.
const screen = (artboard: string) => `/screens/${artboard}`;

export const verifyPaths = {
  match: screen('Verify-1-Match'),
  noMatch: screen('Verify-2-NoMatch'),
  edited: screen('Verify-3-Edited'),
  lookup: screen('Verify-4-Kit-Account-Claim'),
  retracted: screen('Verify-5-Retracted'),
  ledger: screen('Ledger'),
} as const;

/** Query keys these screens read: `q` preloads the Verify box, `brand` picks the Ledger brand. */
export const verifyParams = { query: 'q', brand: 'brand' } as const;

/** Verify with this text already checked (Ledger "Check it", Verify-3 "View the original"). */
export function checkHref(text: string): string {
  return `${verifyPaths.match}?${verifyParams.query}=${encodeURIComponent(text)}`;
}

/** The Ledger opened on one brand (Verify-1 "See aDNA's public ledger"). */
export function ledgerHref(brandId: string): string {
  return `${verifyPaths.ledger}?${verifyParams.brand}=${encodeURIComponent(brandId)}`;
}
