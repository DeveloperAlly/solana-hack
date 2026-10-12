// Parsers for the owner's own social data exports (R9 on issue #38; architecture §6.1 "Source ingestion": "X and
// LinkedIn history from the owner's own data export, parsed in the browser"). They run in the browser, so the raw
// archive (which also holds messages, contacts and other private records) never reaches the Worker: only the post text
// the owner chose to send is posted, to POST /api/brands/:id/sources/social (web/worker/intake.ts).
//
// Pure functions, no screens: the UI sessions wire them to a file picker (issue #38 ownership map). Formats, and how
// far each is verified:
// - X archive: the posts file is data/tweets.js (tweet.js in older archives, and tweets-part1.js and so on when split),
//   a JavaScript assignment `window.YTD.tweets.part0 = [ { "tweet": { ... } }, ... ]`. X's help centre
//   (https://help.x.com/en/managing-your-account/accessing-your-x-data) could not be fetched when this was written
//   (2026-10-13), and the archive's own README documents the files only inside each download. The layout and the
//   fields used here (full_text, created_at, id_str, retweeted) are as reported by third parties
//   (https://www.xbrain.live/x-archive/tweets-js, https://www.tweetarchivist.com/twitter-archive-format-explained), so
//   the parser is defensive: any `window.YTD.<name>.partN =` prefix or none, entries with or without the "tweet"
//   wrapper, and `text` when `full_text` is missing. Anything it cannot read is counted and reported, never guessed.
// - LinkedIn export: LinkedIn's help page lists what the download holds but not its CSV headers
//   (https://www.linkedin.com/help/linkedin/answer/a1339364/downloading-your-account-data). The PROFILE keys used here
//   ("Headline", "Summary", "Industry", "Geo Location", "Websites") are LinkedIn's own, in the Member Data Portability
//   snapshot sample (https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/shared/member-snapshot-api);
//   MEMBER_SHARE_INFO holds "date, URL, shared comments, and visibility status"
//   (https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/shared/snapshot-domain). The Shares.csv
//   header names (Date, ShareLink, ShareCommentary, SharedUrl, MediaUrl, Visibility) are not published by LinkedIn; they
//   are as reported by third parties (https://trevorfox.com/2026/07/how-to-export-linkedin-posts/). Columns are
//   therefore found by name, case-insensitively, wherever the header row is, and a file without a text column is
//   refused with a reason.

export type SocialPlatform = 'x' | 'linkedin';

/** One piece of the owner's own writing, as sent to the Worker. */
export interface SocialItem {
  text: string;
  /** ISO 8601 date-time when the export gives one that can be read exactly. */
  date?: string;
  /** The post's own address, when the export gives one. */
  url?: string;
  /** What the item is when it is not a post (for a profile field, its name: "Headline"). */
  label?: string;
}

export interface SocialParse {
  ok: true;
  platform: SocialPlatform;
  /** Profile fields first (the owner's own description of the work, kept if a long history is cut), then posts newest first. */
  items: SocialItem[];
  /** Entries left out, by reason: reposts are someone else's words; empty entries have no text. */
  skipped: { reposts: number; empty: number; unreadable: number };
  notes: string[];
}
export interface SocialParseFail { ok: false; platform: SocialPlatform; reason: string }
export type SocialParseResult = SocialParse | SocialParseFail;

export interface ExportFile { name: string; content: string }

const BOM = /^﻿/;
const baseName = (name: string) => name.split(/[\\/]/).pop() ?? name;

// ---------------------------------------------------------------------------------------------------------------- X

/** The posts files of an X archive: tweets.js or tweet.js, and their split parts (tweets-part1.js). */
export const X_POSTS_FILE = /^tweets?(-part\d+)?\.js$/i;

/** Months as created_at writes them ("Wed Oct 10 20:19:24 +0000 2018"). */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** created_at ("Wed Oct 10 20:19:24 +0000 2018") as ISO 8601; undefined for any other form. */
export function xDate(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const m = /^[A-Z][a-z]{2} ([A-Z][a-z]{2}) (\d{2}) (\d{2}):(\d{2}):(\d{2}) ([+-])(\d{2})(\d{2}) (\d{4})$/.exec(raw.trim());
  if (!m) return undefined;
  const month = MONTHS.indexOf(m[1]);
  if (month < 0) return undefined;
  const offset = (m[6] === '-' ? -1 : 1) * (Number(m[7]) * 60 + Number(m[8]));
  // The fields as written must name a real moment (Feb 30 does not roll over into March), then the offset applies.
  const local = new Date(Date.UTC(Number(m[9]), month, Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])));
  if (local.getUTCMonth() !== month || local.getUTCDate() !== Number(m[2]) || Number(m[3]) > 23 || Number(m[4]) > 59 || Number(m[5]) > 59) return undefined;
  return new Date(local.getTime() - offset * 60_000).toISOString();
}

/**
 * Post text as written. The archive keeps &, < and > escaped as &amp;, &lt; and &gt; in full_text (reported by third
 * parties who convert archives, for example https://maskray.me/blog/2024-12-25-exporting-tweets, which unescapes HTML
 * entities); those three are decoded, &amp; last so "&amp;lt;" stays the literal text "&lt;". Nothing else is changed.
 */
export const xText = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** The JSON array inside one archive file: the `window.YTD.<name>.partN =` prefix and a trailing ";" removed. */
export function ytdArray(content: string): unknown[] | null {
  const body = content.replace(BOM, '').trim().replace(/^window\.YTD\.[A-Za-z0-9_]+\.part\d+\s*=\s*/, '').replace(/;\s*$/, '');
  try {
    const v = JSON.parse(body) as unknown;
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

/** The owner's posts from the posts files of an X archive. Other files (messages, likes) are ignored, never read. */
export function parseXArchive(files: ExportFile[]): SocialParseResult {
  const posts = files.filter((f) => X_POSTS_FILE.test(baseName(f.name)));
  if (!posts.length) return { ok: false, platform: 'x', reason: 'Choose data/tweets.js from your X archive (tweet.js in older archives).' };
  const skipped = { reposts: 0, empty: 0, unreadable: 0 };
  const notes: string[] = [];
  const items: SocialItem[] = [];
  const seen = new Set<string>();
  for (const f of posts) {
    const list = ytdArray(f.content);
    if (!list) return { ok: false, platform: 'x', reason: `${baseName(f.name)} could not be read as an X archive file; choose data/tweets.js from the archive as downloaded.` };
    for (const entry of list) {
      const t = (entry && typeof entry === 'object' && 'tweet' in entry ? (entry as { tweet: unknown }).tweet : entry) as Record<string, unknown> | null;
      if (!t || typeof t !== 'object') { skipped.unreadable++; continue; }
      const raw = typeof t.full_text === 'string' ? t.full_text : typeof t.text === 'string' ? t.text : null;
      if (raw === null) { skipped.unreadable++; continue; }
      // A repost carries someone else's words; it is not the owner's voice or a claim the owner made.
      if (t.retweeted === true || /^RT @\w+:/.test(raw)) { skipped.reposts++; continue; }
      const text = xText(raw).trim();
      if (!text) { skipped.empty++; continue; }
      const id = typeof t.id_str === 'string' ? t.id_str : typeof t.id === 'string' ? t.id : '';
      // Split archives and repeated picks must not double a post.
      const key = id || text;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ text, date: xDate(t.created_at) });
    }
  }
  if (files.some((f) => /^note-tweet\.js$/i.test(baseName(f.name)))) notes.push('note-tweet.js (the full text of long posts) is not read yet; long posts keep the text tweets.js holds');
  return { ok: true, platform: 'x', items: newestFirst(items), skipped, notes };
}

// --------------------------------------------------------------------------------------------------------- LinkedIn

/**
 * RFC 4180 CSV (https://www.rfc-editor.org/rfc/rfc4180): fields separated by commas, rows by CRLF or LF, a field in
 * double quotes may hold commas, line breaks and doubled quotes. A quote that is never closed makes the file unreadable.
 */
export function parseCsv(content: string): string[][] | null {
  const s = content.replace(BOM, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { quoted = false; i++; continue; }
      field += c;
      i++;
      continue;
    }
    if (c === '"' && field === '') { quoted = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r' || c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += c === '\r' && s[i + 1] === '\n' ? 2 : 1;
      continue;
    }
    field += c;
    i++;
  }
  if (quoted) return null;
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}

const norm = (h: string) => h.trim().toLowerCase().replace(/[\s_]+/g, '');

/** The header row (the first row naming `required`) and a column finder; null when no row names it. */
function table(rows: string[][], required: string) {
  const at = rows.findIndex((r) => r.some((h) => norm(h) === norm(required)));
  if (at < 0) return null;
  const header = rows[at].map(norm);
  const col = (name: string) => header.indexOf(norm(name));
  return { col, body: rows.slice(at + 1) };
}

/** LinkedIn's "2024-01-15 10:30:00" (read as UTC, which the export does not state) as ISO 8601; undefined otherwise. */
export function linkedInDate(raw: string | undefined): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec((raw ?? '').trim());
  if (!m) return undefined;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  const d = new Date(t);
  return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d.toISOString() : undefined;
}

/**
 * The profile fields kept: the owner's own description of their work. Name, address, birth date, postcode, messenger
 * handles and every other personal field are left out on purpose; the brand needs none of them.
 */
export const PROFILE_FIELDS = ['Headline', 'Summary', 'Industry', 'Geo Location', 'Websites'] as const;

const SHARES_FILE = /^shares\.csv$/i;
const PROFILE_FILE = /^profile\.csv$/i;

/** The owner's posts (Shares.csv) and profile text (Profile.csv) from a LinkedIn export; other files are ignored. */
export function parseLinkedInExport(files: ExportFile[]): SocialParseResult {
  const shares = files.filter((f) => SHARES_FILE.test(baseName(f.name)));
  const profiles = files.filter((f) => PROFILE_FILE.test(baseName(f.name)));
  if (!shares.length && !profiles.length) return { ok: false, platform: 'linkedin', reason: 'Choose Shares.csv (your posts) or Profile.csv from your LinkedIn export.' };
  const skipped = { reposts: 0, empty: 0, unreadable: 0 };
  const notes: string[] = [];
  const posts: SocialItem[] = [];
  const profile: SocialItem[] = [];
  const seen = new Set<string>();
  for (const f of shares) {
    const rows = parseCsv(f.content);
    const t = rows && table(rows, 'ShareCommentary');
    if (!t) return { ok: false, platform: 'linkedin', reason: `${baseName(f.name)} has no ShareCommentary column, so it does not look like LinkedIn's Shares.csv; choose the file as exported.` };
    const [text, date, link] = [t.col('ShareCommentary'), t.col('Date'), t.col('ShareLink')];
    for (const r of t.body) {
      const body = (r[text] ?? '').trim();
      // A reshare with no words of the owner's own has nothing to read.
      if (!body) { skipped.empty++; continue; }
      const url = link >= 0 && /^https:\/\/(www\.)?linkedin\.com\//i.test((r[link] ?? '').trim()) ? r[link].trim() : undefined;
      const key = url ?? body;
      if (seen.has(key)) continue;
      seen.add(key);
      posts.push({ text: body, date: date >= 0 ? linkedInDate(r[date]) : undefined, url });
    }
  }
  for (const f of profiles) {
    const rows = parseCsv(f.content);
    const t = rows && table(rows, 'Headline');
    if (!t) return { ok: false, platform: 'linkedin', reason: `${baseName(f.name)} has no Headline column, so it does not look like LinkedIn's Profile.csv; choose the file as exported.` };
    const r = t.body[0] ?? [];
    for (const name of PROFILE_FIELDS) {
      const v = (r[t.col(name)] ?? '').trim();
      if (t.col(name) >= 0 && v) profile.push({ text: v, label: name });
    }
  }
  if (!posts.length && !profile.length) notes.push('no posts or profile text with words of your own were found');
  return { ok: true, platform: 'linkedin', items: [...profile, ...newestFirst(posts)], skipped, notes };
}

/** Dated items newest first, undated after them in file order (Array.prototype.sort is stable since ES2019). */
function newestFirst(items: SocialItem[]) {
  return [...items].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

/**
 * The request body for POST /api/brands/:id/sources/social: the platform and each item's text, nothing else. Dates,
 * post addresses and profile labels stay in the browser (Codex review on pull request 100); the Worker refuses any other field
 * (web/worker/sources/social.ts readSocial), so the promise holds at both ends.
 */
export const socialPayload = (p: SocialParse) => ({ platform: p.platform, items: p.items.map(({ text }) => ({ text })) });
