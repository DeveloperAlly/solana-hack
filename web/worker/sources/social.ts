import { SOURCE_READ_LIMIT, utf8Length } from '../engine/readers';
import { factTrust } from './registry';
import { clock, contentCount, type SourceResult } from './types';

/**
 * Social export adapter (R9 on issue #38; architecture §6.1 "Source ingestion": "X and LinkedIn history from the
 * owner's own data export, parsed in the browser"). The browser parses the archive (web/src/lib/socialExport.ts) and
 * sends only text items; this turns them into one source text, the owner's own words (kind social_export, trust owned).
 * Pure: it never writes or calls a model; intake.ts stores the text and starts extraction on it.
 */
export const SOCIAL_PLATFORMS = { x: 'X', linkedin: 'LinkedIn' } as const;
export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;
/** Items accepted in one request; a larger archive is sent newest first and the rest is reported as left out. */
export const SOCIAL_MAX_ITEMS = 5000;
/**
 * Longest source text: what the extract_facts read step carries (engine/readers.ts SOURCE_READ_LIMIT, in characters and
 * in UTF-8 bytes), so nothing stored is cut before extraction. Items past it are left out whole, oldest first, and counted.
 */
export const SOCIAL_LIMIT = SOURCE_READ_LIMIT;
/** Request body cap, enforced by the streamed read in intake.ts: room for the stored text several times over in JSON. */
export const SOCIAL_MAX_BODY_BYTES = 2 * 1024 * 1024;

export interface SocialInput { platform?: unknown; items?: unknown; [other: string]: unknown }

/**
 * The items as one text, newest first, one item per paragraph block, separated by a blank line. Item text is kept as
 * written (line breaks normalised to \n), so a quote from it is the owner's exact words.
 */
export function readSocial(input: SocialInput): SourceResult {
  const c = clock();
  const { trust } = factTrust('social_export');
  const platform = typeof input.platform === 'string' && input.platform in SOCIAL_PLATFORMS ? (input.platform as SocialPlatform) : null;
  const fail = (code: 'invalid_input' | 'empty' | 'too_large', reason: string) => ({ ok: false as const, kind: 'social_export' as const, code, reason, meta: c.meta(0, 0, 'export') });
  if (!platform) return fail('invalid_input', 'Say which export this is: x or linkedin.');
  // Only the platform and each item's text are accepted (web/src/lib/socialExport.ts socialPayload): anything else
  // from an export (dates, addresses, profile fields) is refused, never stored (Codex review on PR #100).
  if (Object.keys(input).some((k) => k !== 'platform' && k !== 'items')) return fail('invalid_input', 'Send only the platform and the items.');
  if (!Array.isArray(input.items)) return fail('invalid_input', 'Send the posts as a list of items.');
  if (input.items.length > SOCIAL_MAX_ITEMS) return fail('too_large', `That is more than ${SOCIAL_MAX_ITEMS.toLocaleString('en')} posts; send the newest ${SOCIAL_MAX_ITEMS.toLocaleString('en')}.`);
  const label = SOCIAL_PLATFORMS[platform];
  const texts: string[] = [];
  let length = 0;
  let bytes = 0;
  let left = 0;
  let empty = 0;
  for (const item of input.items) {
    const raw = item && typeof item === 'object' && !Array.isArray(item) ? (item as { text?: unknown }).text : undefined;
    if (typeof raw !== 'string') return fail('invalid_input', 'Every item needs its text.');
    if (Object.keys(item as object).length !== 1) return fail('invalid_input', 'Send only the text of each item.');
    const text = raw.replace(/\r\n?/g, '\n').trim();
    if (contentCount(text) === 0) { empty++; continue; }
    // An item is kept whole or left out, never cut: a cut post could drop the sentence a quote comes from.
    // Once one item does not fit, every older item is left out too, so what is kept is exactly the newest items.
    const sep = texts.length ? 2 : 0;
    const add = sep + text.length;
    const addBytes = sep + utf8Length(text);
    if (left || length + add > SOCIAL_LIMIT.maxChars || bytes + addBytes > SOCIAL_LIMIT.maxBytes) { left++; continue; }
    texts.push(text);
    length += add;
    bytes += addBytes;
  }
  if (!texts.length) return fail('empty', `There is no text of your own in that ${label} export to read.`);
  if (left) c.notes.push(`${left} older item(s) left out: one source holds at most ${SOCIAL_LIMIT.maxChars.toLocaleString('en')} characters (${SOCIAL_LIMIT.maxBytes.toLocaleString('en')} bytes)`);
  if (empty) c.notes.push(`${empty} item(s) without text skipped`);
  const name = `${label} export (${texts.length} item${texts.length === 1 ? '' : 's'})`;
  return { ok: true, kind: 'social_export', trust, name, title: name, text: texts.join('\n\n'), meta: c.meta(texts.length, 0, 'export') };
}
