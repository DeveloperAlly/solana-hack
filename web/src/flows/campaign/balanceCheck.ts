// The server's check of the spending cap against the brand wallet's USDC balance (D31 over-balance; issue #51). A
// result holds for the cap it checked: a cap at or above an over-balance cap is still over, and a lower cap no longer
// carries the flag, so the person can follow the remedy and go on (Codex review on PR #79). The server re-checks the
// new cap when the step is saved (INTEGRATION: PATCH /api/campaigns/:id { cap }).

/** The last balance check: the cap it checked, and whether that cap is above the balance. */
export interface BalanceCheck {
  checkedCap: string;
  over: boolean;
}

/** Whether `cap` is over the balance, by the last check. */
export function isOverBalance(cap: string, check: BalanceCheck | null): boolean {
  if (!check?.over) return false;
  const value = Number(cap);
  const checked = Number(check.checkedCap);
  return !Number.isFinite(value) || !Number.isFinite(checked) || value >= checked;
}
