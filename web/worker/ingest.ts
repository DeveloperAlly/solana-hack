import { HttpError } from './env';

const MAX_BYTES = 1_500_000;

function decode(s: string) {
  return s
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
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
    res = await fetch(url.toString(), { redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'user-agent': 'WaterlilyBot/0.1 (+https://jamjam.tech)' } });
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
