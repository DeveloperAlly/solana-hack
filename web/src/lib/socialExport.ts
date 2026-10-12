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
// - X long posts: a post over 280 characters is cut short in tweets.js, and its full text is in data/note-tweet.js
//   (https://markdownme.com/tools/x-archive-to-markdown/download-your-x-archive, https://prunesocial.com/guides/x).
//   How note-tweet.js is read, and how a note is matched to its post, is set out at parseXNotes and linkNotes below.
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
  /**
   * Entries left out, by reason: reposts are someone else's words; empty entries have no text; unmatched are X long-post
   * texts (note-tweet.js) that could belong to more than one post, so none is given a text that may not be its own.
   */
  skipped: { reposts: number; empty: number; unreadable: number; unmatched: number };
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

/** The long-post files of an X archive: note-tweet.js, and split parts in the archive's partN convention. */
export const X_NOTES_FILE = /^note-tweet(-part\d+)?\.js$/i;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * An ISO 8601 date-time with seconds and a zone ("2018-10-10T20:19:24.000Z", or "+10:00") as epoch milliseconds;
 * undefined for any other form, or for fields that do not name a real moment (Feb 30 does not roll over, as in xDate).
 */
export function isoInstant(raw: unknown): number | undefined {
  if (typeof raw !== 'string') return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3})\d*)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(raw.trim());
  if (!m) return undefined;
  const [y, mo, d, h, mi, sec] = [+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]];
  const local = new Date(Date.UTC(y, mo, d, h, mi, sec, m[7] ? +m[7].padEnd(3, '0') : 0));
  if (local.getUTCMonth() !== mo || local.getUTCDate() !== d || h > 23 || mi > 59 || sec > 59) return undefined;
  const offset = m[8] === 'Z' ? 0 : (m[9] === '-' ? -1 : 1) * (+m[10] * 60 + +m[11]);
  return local.getTime() - offset * 60_000;
}

/**
 * A text as compared when a long post is matched to its cut-short copy, never as sent: &, <, > decoded (xText), line
 * breaks and runs of spaces made one space, leading @mentions removed, and the ending tweets.js adds to a cut post
 * removed (a "…", a t.co link to the full post, spaces; in any order, repeatedly). Leading mentions are removed because
 * a reply's note text does not hold them: the exporter at https://gist.github.com/JD-P/fc473872bbff4b48b5235cbe4aaeba1d
 * puts the reply's @handles back in front of the note text.
 */
export function noteKey(s: string): string {
  let t = xText(s).replace(/\s+/g, ' ').trim().replace(/^(?:@\w+ )+/, '');
  for (;;) {
    const next = t.replace(/https?:\/\/t\.co\/[A-Za-z0-9]+$/, '').replace(/…$/, '').trimEnd();
    if (next === t) return t;
    t = next;
  }
}

/** One long post from note-tweet.js. */
export interface XNote { noteId: string; text: string; tweetId?: string; at?: number }

/**
 * The long posts of an X archive's note-tweet.js. Two shapes are documented, so both are read:
 * - X's own README inside each archive (a published copy: https://twitter-archive.moule.world/data/README.txt) lists
 *   noteTweetId, createdAt, lifecycle, updatedAt and core ("Core fields for a note tweet such as entity information
 *   (hashtag, cashtag, url, mentions), richtext and text"): the text is noteTweet.core.text.
 * - The community archive's documentation (https://github.com/TheExGenesis/community-archive/blob/main/docs/archive_data.md)
 *   shows window.YTD.note_tweet.part0 entries of { noteTweet: { noteTweetId, noteTweetResults: { text, entitySet },
 *   tweetId } }: the text is noteTweet.noteTweetResults.text, with the post's id in tweetId.
 * The text is core.text, else noteTweetResults.text; an entry with neither is unreadable and counted. No source says
 * whether note text escapes &, < and > as full_text does, so it is kept as written; matching compares decoded forms.
 */
export function parseXNotes(list: unknown[], skipped: SocialParse['skipped']): XNote[] {
  const notes: XNote[] = [];
  for (const entry of list) {
    const n = isObj(entry) && 'noteTweet' in entry ? entry.noteTweet : entry;
    if (!isObj(n)) { skipped.unreadable++; continue; }
    const core = isObj(n.core) ? n.core : undefined;
    const results = isObj(n.noteTweetResults) ? n.noteTweetResults : undefined;
    const raw = typeof core?.text === 'string' ? core.text : typeof results?.text === 'string' ? results.text : null;
    if (raw === null) { skipped.unreadable++; continue; }
    const text = raw.trim();
    if (!text) { skipped.empty++; continue; }
    notes.push({
      noteId: typeof n.noteTweetId === 'string' ? n.noteTweetId : '',
      text,
      tweetId: typeof n.tweetId === 'string' && n.tweetId ? n.tweetId : undefined,
      at: isoInstant(n.createdAt),
    });
  }
  return notes;
}

/** A post read from tweets.js, with what a long post is matched on. */
interface XPost { id: string; item: SocialItem; key: string; at?: number }

/**
 * Each long post matched to at most one post, so no post is sent twice or given another post's text. X's README
 * documents no field linking a note to its tweets.js entry, so a match is made only on evidence, in this order:
 * 1. by id: the note's tweetId equals the post's id_str (the community archive's shape, above);
 * 2. by time and text: exactly one post has the note's createdAt instant as its created_at, and its text (noteKey) is
 *    a prefix of the note's. Time is what the exporter at https://gist.github.com/JD-P/fc473872bbff4b48b5235cbe4aaeba1d
 *    matches on; the prefix check makes a same-second post that is not this one fail to match;
 * 3. by text alone: exactly one post's text is a prefix of the note's (the importer described at
 *    https://gist.github.com/jawond/0779b79a230d6ef7403f54ea80cdf33c, section 12, builds "a prefix-based lookup to
 *    match truncated tweets with their full content").
 * A matched post takes the note's full text and keeps its own date. A note no post matches is a post of its own, dated
 * by its createdAt. A note that more than one post could match (at any step), or a post more than one note matches by
 * the same kind of evidence, is left unmatched and counted: the post keeps the text tweets.js holds. A match by id
 * outranks one by text. A note matched by id to a repost is left out with the repost (already counted there).
 */
export function linkNotes(posts: XPost[], repostIds: Set<string>, notes: XNote[], skipped: SocialParse['skipped']): SocialItem[] {
  const byId = new Map(posts.filter((p) => p.id).map((p) => [p.id, p]));
  const claims = new Map<XPost, { note: XNote; byId: boolean }[]>();
  const own: SocialItem[] = [];
  const isPrefix = (p: XPost, key: string) => p.key !== '' && key.startsWith(p.key);
  for (const note of notes) {
    if (note.tweetId && byId.has(note.tweetId)) {
      const p = byId.get(note.tweetId)!;
      claims.set(p, [...(claims.get(p) ?? []), { note, byId: true }]);
      continue;
    }
    if (note.tweetId && repostIds.has(note.tweetId)) continue;
    const key = noteKey(note.text);
    const sameTime = note.at === undefined ? [] : posts.filter((p) => p.at === note.at && isPrefix(p, key));
    const candidates = sameTime.length ? sameTime : posts.filter((p) => isPrefix(p, key));
    if (candidates.length > 1) { skipped.unmatched++; continue; }
    if (candidates.length === 1) {
      claims.set(candidates[0], [...(claims.get(candidates[0]) ?? []), { note, byId: false }]);
      continue;
    }
    own.push({ text: note.text, date: note.at === undefined ? undefined : new Date(note.at).toISOString() });
  }
  for (const [post, list] of claims) {
    const ids = list.filter((c) => c.byId);
    const winners = ids.length ? ids : list;
    if (winners.length === 1) post.item.text = winners[0].note.text;
    skipped.unmatched += winners.length === 1 ? list.length - 1 : list.length;
  }
  return own;
}

/**
 * The owner's posts from the posts files of an X archive, with long posts in full when note-tweet.js is chosen too.
 * Other files (messages, likes, deleted-note-tweet.js) are ignored, never read.
 */
export function parseXArchive(files: ExportFile[]): SocialParseResult {
  const postFiles = files.filter((f) => X_POSTS_FILE.test(baseName(f.name)));
  const noteFiles = files.filter((f) => X_NOTES_FILE.test(baseName(f.name)));
  if (!postFiles.length) return { ok: false, platform: 'x', reason: 'Choose data/tweets.js from your X archive (tweet.js in older archives).' };
  const skipped = { reposts: 0, empty: 0, unreadable: 0, unmatched: 0 };
  const notes: string[] = [];
  const posts: XPost[] = [];
  const repostIds = new Set<string>();
  const seen = new Set<string>();
  for (const f of postFiles) {
    const list = ytdArray(f.content);
    if (!list) return { ok: false, platform: 'x', reason: `${baseName(f.name)} could not be read as an X archive file; choose data/tweets.js from the archive as downloaded.` };
    for (const entry of list) {
      const t = (entry && typeof entry === 'object' && 'tweet' in entry ? (entry as { tweet: unknown }).tweet : entry) as Record<string, unknown> | null;
      if (!t || typeof t !== 'object') { skipped.unreadable++; continue; }
      const raw = typeof t.full_text === 'string' ? t.full_text : typeof t.text === 'string' ? t.text : null;
      if (raw === null) { skipped.unreadable++; continue; }
      const id = typeof t.id_str === 'string' ? t.id_str : typeof t.id === 'string' ? t.id : '';
      // A repost carries someone else's words; it is not the owner's voice or a claim the owner made.
      if (t.retweeted === true || /^RT @\w+:/.test(raw)) {
        if (id) repostIds.add(id);
        skipped.reposts++;
        continue;
      }
      const text = xText(raw).trim();
      if (!text) { skipped.empty++; continue; }
      // Split archives and repeated picks must not double a post.
      const key = id || text;
      if (seen.has(key)) continue;
      seen.add(key);
      const date = xDate(t.created_at);
      posts.push({ id, item: { text, date }, key: noteKey(raw), at: date === undefined ? undefined : Date.parse(date) });
    }
  }
  const own: SocialItem[] = [];
  if (noteFiles.length) {
    const noteList: XNote[] = [];
    const seenNotes = new Set<string>();
    for (const f of noteFiles) {
      const list = ytdArray(f.content);
      if (!list) return { ok: false, platform: 'x', reason: `${baseName(f.name)} could not be read as an X archive file; choose data/note-tweet.js from the archive as downloaded.` };
      // Split archives and repeated picks must not double a long post either.
      for (const n of parseXNotes(list, skipped)) {
        const key = n.noteId || n.text;
        if (seenNotes.has(key)) continue;
        seenNotes.add(key);
        noteList.push(n);
      }
    }
    own.push(...linkNotes(posts, repostIds, noteList, skipped));
    if (skipped.unmatched) notes.push(`${skipped.unmatched} long post text${skipped.unmatched === 1 ? '' : 's'} in note-tweet.js could not be matched to exactly one post, so ${skipped.unmatched === 1 ? 'that post keeps' : 'those posts keep'} the shortened text tweets.js holds`);
  }
  return { ok: true, platform: 'x', items: newestFirst([...posts.map((p) => p.item), ...own]), skipped, notes };
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
  const skipped = { reposts: 0, empty: 0, unreadable: 0, unmatched: 0 };
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
