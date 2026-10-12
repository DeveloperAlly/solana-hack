// Solana Explorer link for a devnet transaction. The demo runs on devnet only (backend map §1, "Purpose of the build").
// The live screens (hub/Home, hub/Brand, create/Create) build the same URL inline; they are frozen by issue #45, so new
// screens use this helper and the live ones can move to it when the new flow replaces them.
export const SOLANA_CLUSTER = 'devnet';

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=${SOLANA_CLUSTER}`;
}
