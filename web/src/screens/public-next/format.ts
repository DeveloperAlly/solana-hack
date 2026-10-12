import type { IsoDateTime } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "2026-10-05T16:18" -> "5 Oct 2026, 16:18" (the canvas format, Verify-1-Match). Read from the string, not a Date, so
 * the output never shifts with the viewer's time zone. Null stays bracketed, as the canvas draws it.
 */
export function formatDateTime(iso: IsoDateTime, placeholder = '[date]'): string {
  if (!iso) return placeholder;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso);
  if (!m) return placeholder;
  const [, y, mo, d, h, mi] = m;
  const date = `${Number(d)} ${MONTHS[Number(mo) - 1]} ${y}`;
  return h ? `${date}, ${h}:${mi}` : date;
}

/** 0.547 -> "55%". */
export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
