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
 * Longest source text, matching what the extract_facts read step carries (maxChars 200000 in spec/db/011), so nothing
 * stored is cut before extraction. Items past it are left out whole, oldest first, and counted.
 */
export const SOCIAL_MAX_CHARS = 200_000;
/** Request body cap, enforced by the streamed read in intake.ts: room for the stored text several times over in JSON. */
export const SOCIAL_MAX_BODY_BYTES = 2 * 1024 * 1024;

export interface SocialInput { platform?: unknown; items?: unknown }

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
  if (!Array.isArray(input.items)) return fail('invalid_input', 'Send the posts as a list of items.');
  if (input.items.length > SOCIAL_MAX_ITEMS) return fail('too_large', `That is more than ${SOCIAL_MAX_ITEMS.toLocaleString('en')} posts; send the newest ${SOCIAL_MAX_ITEMS.toLocaleString('en')}.`);
  const label = SOCIAL_PLATFORMS[platform];
  const texts: string[] = [];
  let length = 0;
  let left = 0;
  let empty = 0;
  for (const item of input.items) {
    const raw = item && typeof item === 'object' ? (item as { text?: unknown }).text : undefined;
    if (typeof raw !== 'string') return fail('invalid_input', 'Every item needs its text.');
    const text = raw.replace(/\r\n?/g, '\n').trim();
    if (contentCount(text) === 0) { empty++; continue; }
    // An item is kept whole or left out, never cut: a cut post could drop the sentence a quote comes from.
    // Once one item does not fit, every older item is left out too, so what is kept is exactly the newest items.
    const add = (texts.length ? 2 : 0) + text.length;
    if (left || length + add > SOCIAL_MAX_CHARS) { left++; continue; }
    texts.push(text);
    length += add;
  }
  if (!texts.length) return fail('empty', `There is no text of your own in that ${label} export to read.`);
  if (left) c.notes.push(`${left} older item(s) left out: the text is limited to ${SOCIAL_MAX_CHARS.toLocaleString('en')} characters`);
  if (empty) c.notes.push(`${empty} item(s) without text skipped`);
  const name = `${label} export (${texts.length} item${texts.length === 1 ? '' : 's'})`;
  return { ok: true, kind: 'social_export', trust, name, title: name, text: texts.join('\n\n'), meta: c.meta(texts.length, 0, 'export') };
}
