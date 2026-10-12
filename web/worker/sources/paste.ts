import { factTrust } from './registry';
import { clock, letterCount, type SourceResult } from './types';

/**
 * Paste adapter (issue #33): text the owner pastes in is an owner-supplied source (trust owned, sources/registry.ts),
 * stored whole so quotes from it are checked like any page's. It is also the fallback the site and document adapters
 * point to when they cannot read something.
 */
export const PASTE_MAX_CHARS = 200_000;

export function readPaste(input: { text: string; name?: string }): SourceResult {
  const c = clock();
  const { trust } = factTrust('paste');
  const text = (typeof input.text === 'string' ? input.text : '').replace(/\r\n?/g, '\n').trim();
  const name = (input.name ?? '').trim().slice(0, 120) || undefined;
  if (letterCount(text) === 0) return { ok: false, kind: 'paste', code: 'empty', reason: 'There is no text to read; paste the text you want us to use.', name, meta: c.meta(0, 0) };
  // Refused, not cut: a cut paste could drop the sentence a quote comes from.
  if (text.length > PASTE_MAX_CHARS) return { ok: false, kind: 'paste', code: 'too_large', reason: `That is longer than ${PASTE_MAX_CHARS.toLocaleString('en')} characters; paste the most important parts, or split it into several pastes.`, name, meta: c.meta(0, 0) };
  const title = name ?? text.split('\n')[0].slice(0, 80);
  return { ok: true, kind: 'paste', trust, name, title, text, meta: c.meta(1, 0, 'paste') };
}
