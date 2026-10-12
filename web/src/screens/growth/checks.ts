// Every check on the Growth page returns one { blocking, label } (brief: gates and badges share one source). The
// screen shows `label` and disables its action while `blocking`, so a blocked badge never sits beside an enabled button.
import type { Check } from './types';

const pass = (label: string): Check => ({ blocking: false, label });
const block = (label: string): Check => ({ blocking: true, label });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailCheck(value: string): Check {
  const v = value.trim();
  if (!v) return block('Enter an email address.');
  return EMAIL.test(v) ? pass('Email looks right.') : block('Enter a full email address, like name@example.com.');
}

/** Free seats left; an invite takes one. */
export function seatCheck(used: number, limit: number): Check {
  const left = limit - used;
  return left > 0 ? pass(`${used} of ${limit} seats used`) : block(`All ${limit} seats are in use. Revoke an invite to free one.`);
}

/** A tip amount in USDC: positive, at most 2 decimals (USDC is shown to the cent here). */
export function tipAmountCheck(raw: string): Check {
  const v = raw.trim();
  if (!v) return block('Enter an amount in USDC.');
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return block('Use a number with up to 2 decimals, like 5 or 2.50.');
  return Number(v) > 0 ? pass('Amount ready.') : block('The amount must be more than 0.');
}

/** Tips need the creator's own wallet: USDC goes straight to it (ADR-006). */
export function walletCheck(wallet: string | null): Check {
  return wallet ? pass('Tips go to the creator’s own wallet.') : block('This creator has not linked a wallet, so tips are off.');
}

/** The first blocking check, or a pass when none blocks. */
export function firstBlocking(checks: Check[], okLabel: string): Check {
  return checks.find((c) => c.blocking) ?? pass(okLabel);
}
