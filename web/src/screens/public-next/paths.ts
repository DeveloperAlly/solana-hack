// Link targets for the "Verify + ledger" page (issue #49). Paths come from the gallery's shared screenPath /
// useScreenHref (web/src/gallery/screenPath.ts), which keeps ?theme=; this file only names the artboards and adds the
// two page params. The live /verify and /ledger stay unchanged.
import { useScreenHref } from '../../gallery/screenPath';

export const verifyArtboards = {
  match: 'Verify-1-Match',
  noMatch: 'Verify-2-NoMatch',
  edited: 'Verify-3-Edited',
  lookup: 'Verify-4-Kit-Account-Claim',
  retracted: 'Verify-5-Retracted',
  ledger: 'Ledger',
} as const;

/** Query keys these screens read: `q` preloads the Verify box, `brand` picks the Ledger brand. */
export const verifyParams = { query: 'q', brand: 'brand' } as const;

function withParam(path: string, key: string, value: string): string {
  return `${path}${path.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(value)}`;
}

export interface VerifyLinks {
  /** Verify with this text already checked (Ledger "Check it", Verify-3 "View the original"). */
  check: (text: string) => string;
  /** The Ledger opened on one brand (Verify-1 "See aDNA's public ledger"). */
  ledger: (brandId: string) => string;
}

/** Links that carry a page param as well as the gallery theme. Plain screen links use the gallery's ScreenLink. */
export function useVerifyLinks(): VerifyLinks {
  const href = useScreenHref();
  return {
    check: (text) => withParam(href(verifyArtboards.match), verifyParams.query, text),
    ledger: (brandId) => withParam(href(verifyArtboards.ledger), verifyParams.brand, brandId),
  };
}
