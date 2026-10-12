import { HttpError } from './env';

const MAX_BYTES = 1_500_000;

// Named entities that page text commonly carries; numeric ones (decimal and hex) are decoded generically.
const ENTITIES: Record<string, string> = {
  nbsp: ' ', lt: '<', gt: '>', quot: '"', apos: "'", shy: '\u00AD', lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C',
  rdquo: '\u201D', ndash: '\u2013', mdash: '\u2014', hellip: '\u2026', zwj: '\u200D', zwnj: '\u200C',
};
const codePoint = (n: number) => (Number.isInteger(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '');

/** Decodes HTML entities in one pass, so "&amp;lt;" stays the text "&lt;" rather than becoming "<". */
export function decode(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') return codePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) || m;
    if (e.toLowerCase() === 'amp') return '&';
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Fetches one public http(s) page and returns its title and readable text. */
export async function readPage(raw: string): Promise<{ url: string; title: string; text: string }> {
  let url: URL;
  try {
    url = new URL(raw.includes('://') ? raw : `https://${raw}`);
  } catch {
    throw new HttpError(400, 'that is not a web address');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new HttpError(400, 'only http and https links can be read');
  if (url.port && url.port !== '80' && url.port !== '443') throw new HttpError(400, 'that link uses an unusual port');
  let res: Response;
  try {
    res = await fetch(url.toString(), { redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'user-agent': 'JamJamBot/0.1 (+https://jamjam.tech)' } });
  } catch {
    throw new HttpError(502, 'the site did not answer in time');
  }
  if (!res.ok) throw new HttpError(502, `the site answered with HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (!/text\/html|text\/plain|markdown/.test(type)) throw new HttpError(415, 'that link is not a web page or text file');
  const body = (await res.text()).slice(0, MAX_BYTES);
  const title = decode((body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? url.hostname).trim()).slice(0, 200);
  const text = decode(
    body
      .replace(/<(script|style|noscript|svg|nav|footer)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|section|article)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
  if (text.length < 40) throw new HttpError(422, 'that page has almost no readable text');
  return { url: res.url || url.toString(), title, text };
}
