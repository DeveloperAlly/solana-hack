import { Field, Stack, Text } from '../primitives';

export interface SoonSpendingCapFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Wallet balance as the server reports it (may be a bracketed placeholder in fixtures). */
  balance: string;
  /** Server check: the cap is above the wallet balance. */
  overBalance?: boolean;
  currency?: string;
}

/** Client check for a spending cap: a number above zero. */
export function capError(value: string): string | null {
  const n = Number(value);
  return value.trim() === '' || !Number.isFinite(n) || n <= 0 ? 'Enter a cap above 0.' : null;
}

/** D31 SpendingCapField: the campaign's cap, the wallet balance and why money stays put; over-balance is an error. */
export function SoonSpendingCapField({ value, onChange, balance, overBalance = false, currency = 'USDC' }: SoonSpendingCapFieldProps) {
  const error = capError(value) ?? (overBalance ? `The cap is above your wallet balance (${balance} ${currency}). Lower it or top up.` : null);
  return (
    <Stack gap={2}>
      <Field label={`Spending cap (${currency})`} inputMode="decimal" value={value} error={error} onChange={(e: { target: { value: string } }) => onChange(e.target.value)} />
      <Text variant="small" tone="secondary">
        Wallet balance {balance} {currency}. Money stays in your wallet until a post is approved and you pay it.
      </Text>
    </Stack>
  );
}
