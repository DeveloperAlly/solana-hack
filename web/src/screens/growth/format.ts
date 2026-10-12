// Formatters for the Growth page. Dates reuse the Verify page's formatter so both pages print the same canvas format.
export { formatDateTime } from '../public-next/format';

/** 12.5 -> "12.50 USDC"; null stays bracketed, as sample amounts are placeholders. */
export function formatUsdc(amount: number | null, placeholder = '[amount]'): string {
  return amount === null ? placeholder : `${amount.toFixed(2)} USDC`;
}

/** 0.03 -> "3%". */
export function formatRate(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}

/** The fee and the creator's share of a tip, rounded to the cent (the fee rounds half up). */
export function splitTip(amount: number, feeRate: number): { fee: number; net: number } {
  const fee = Math.round(amount * feeRate * 100) / 100;
  return { fee, net: Math.round((amount - fee) * 100) / 100 };
}
