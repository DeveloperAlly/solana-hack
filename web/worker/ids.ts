import { sha256Hex } from './env';

/** A stable UUID for a row, from the parts that identify it, so a retried step writes the same rows (name-based, as in
 * RFC 9562 §5.8 UUIDv8 layout: https://www.rfc-editor.org/rfc/rfc9562#section-5.8). */
export async function stableId(...parts: string[]) {
  const h = await sha256Hex(parts.join('\u0000'));
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-8${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
