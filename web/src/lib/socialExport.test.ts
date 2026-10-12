import { describe, expect, it } from 'vitest';
import { isoInstant, linkedInDate, noteKey, parseCsv, parseLinkedInExport, parseXArchive, socialPayload, xDate, xText, ytdArray } from './socialExport';

// Synthetic fixtures in the shapes described in socialExport.ts (no real archive is committed: they hold private data).
const tweet = (id: string, full_text: string, created_at: string, extra: Record<string, unknown> = {}) => ({ tweet: { id_str: id, full_text, created_at, retweeted: false, ...extra } });
const tweetsJs = (part: number, entries: unknown[]) => `window.YTD.tweets.part${part} = ${JSON.stringify(entries, null, 2)}`;

describe('X archive (data/tweets.js, parsed in the browser)', () => {
  it('reads the owner\'s posts newest first, decodes &amp; &lt; &gt;, and leaves reposts out', () => {
    const r = parseXArchive([{ name: 'data/tweets.js', content: tweetsJs(0, [
      tweet('1', 'JamJam started in Melbourne in 2024 &amp; we ship weekly &lt;3', 'Mon Jan 15 10:15:00 +0000 2024'),
      tweet('2', 'RT @someone: their words, not ours', 'Tue Jan 16 10:15:00 +0000 2024'),
      tweet('3', 'Every post is checked by a person.', 'Wed Mar 06 08:00:00 +0000 2024'),
      tweet('4', 'Reposted with the flag', 'Wed Mar 06 09:00:00 +0000 2024', { retweeted: true }),
      tweet('5', '   ', 'Wed Mar 06 09:00:00 +0000 2024'),
    ]) }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.items).toEqual([
      { text: 'Every post is checked by a person.', date: '2024-03-06T08:00:00.000Z' },
      { text: 'JamJam started in Melbourne in 2024 & we ship weekly <3', date: '2024-01-15T10:15:00.000Z' },
    ]);
    expect(r.skipped).toEqual({ reposts: 2, empty: 1, unreadable: 0, unmatched: 0 });
    expect(socialPayload(r)).toEqual({ platform: 'x', items: r.items.map((i) => ({ text: i.text })) });
  });

  it('reads older tweet.js, split parts, entries without the wrapper, and `text` when full_text is missing; a post in two parts counts once', () => {
    const r = parseXArchive([
      { name: 'tweet.js', content: `window.YTD.tweet.part0 = [{"id_str":"1","text":"Old style post","created_at":"Fri Jan 01 00:00:00 +0000 2016"}];` },
      { name: 'data/tweets-part1.js', content: tweetsJs(1, [tweet('9', 'Second part post', 'Sat Jan 02 00:00:00 +0000 2016'), tweet('1', 'Old style post', 'Fri Jan 01 00:00:00 +0000 2016')]) },
      { name: 'data/direct-messages.js', content: 'window.YTD.direct_messages.part0 = [{"secret":"never read"}]' },
    ]);
    expect(r.ok && r.items.map((i) => i.text)).toEqual(['Second part post', 'Old style post']);
  });

  it('counts entries it cannot read instead of guessing', () => {
    const r = parseXArchive([
      { name: 'tweets.js', content: tweetsJs(0, [null, { tweet: { id_str: '1' } }, tweet('2', 'Fine', 'bad date')]) },
      { name: 'note-tweet.js', content: 'window.YTD.note_tweet.part0 = []' },
    ]);
    expect(r.ok && r.skipped).toEqual({ reposts: 0, empty: 0, unreadable: 2, unmatched: 0 });
    expect(r.ok && r.items).toEqual([{ text: 'Fine', date: undefined }]);
    expect(r.ok && r.notes).toEqual([]);
  });

  it('refuses a missing posts file or one that is not an archive file, with what to choose', () => {
    expect(parseXArchive([{ name: 'like.js', content: '[]' }])).toMatchObject({ ok: false, reason: expect.stringMatching(/tweets\.js/) });
    expect(parseXArchive([{ name: 'tweets.js', content: 'window.YTD.tweets.part0 = [{' }])).toMatchObject({ ok: false, reason: expect.stringMatching(/could not be read/) });
    expect(ytdArray('window.YTD.tweets.part0 = {"a":1}')).toBeNull();
    expect(ytdArray('﻿[1]')).toEqual([1]);
  });

  it('created_at becomes ISO 8601 with its offset applied; an impossible date is dropped, never rolled over', () => {
    expect(xDate('Wed Oct 10 20:19:24 +0000 2018')).toBe('2018-10-10T20:19:24.000Z');
    expect(xDate('Wed Oct 10 20:19:24 +1000 2018')).toBe('2018-10-10T10:19:24.000Z');
    expect(xDate('Wed Feb 30 20:19:24 +0000 2018')).toBeUndefined();
    expect(xDate('2018-10-10')).toBeUndefined();
    expect(xText('&amp;lt;')).toBe('&lt;');
  });
});

// Long posts (data/note-tweet.js), in the two documented shapes: X's README (core.text, createdAt) and the community
// archive's (noteTweetResults.text, tweetId). Sources are cited at parseXNotes and linkNotes in socialExport.ts.
const LONG = 'JamJam builds a brand from a short interview and the brand\'s own site. '.repeat(5).trim() + ' Every post is checked by a person before it is registered.';
const CUT = `${LONG.slice(0, 270)}… https://t.co/AbC123xyz`;
const coreNote = (noteTweetId: string, text: string, createdAt: string) => ({ noteTweet: { noteTweetId, createdAt, updatedAt: createdAt, lifecycle: { value: 'live' }, core: { text, urls: [], mentions: [] } } });
const resultsNote = (noteTweetId: string, text: string, tweetId: string) => ({ noteTweet: { noteTweetId, noteTweetResults: { text, entitySet: { hashtags: [], urls: [] } }, tweetId } });
const notesJs = (entries: unknown[], part = 0) => `window.YTD.note_tweet.part${part} = ${JSON.stringify(entries, null, 2)}`;
const texts = (r: ReturnType<typeof parseXArchive>) => (r.ok ? r.items.map((i) => i.text) : []);

describe('X long posts (data/note-tweet.js): sent in full, never twice', () => {
  it('README shape: a post cut short in tweets.js is matched by its time and text, and arrives in full with its own date', () => {
    const r = parseXArchive([
      { name: 'data/tweets.js', content: tweetsJs(0, [tweet('10', CUT, 'Wed Oct 10 20:19:24 +0000 2018'), tweet('11', 'A short post.', 'Thu Oct 11 08:00:00 +0000 2018')]) },
      { name: 'data/note-tweet.js', content: notesJs([coreNote('900', LONG, '2018-10-10T20:19:24.000Z')]) },
    ]);
    expect(r.ok && r.items).toEqual([{ text: 'A short post.', date: '2018-10-11T08:00:00.000Z' }, { text: LONG, date: '2018-10-10T20:19:24.000Z' }]);
    expect(r.ok && r.skipped).toEqual({ reposts: 0, empty: 0, unreadable: 0, unmatched: 0 });
    // Text only reaches the Worker, and the shortened copy is gone.
    const sent = socialPayload(r as Extract<typeof r, { ok: true }>);
    expect(sent).toEqual({ platform: 'x', items: [{ text: 'A short post.' }, { text: LONG }] });
    expect(JSON.stringify(sent)).not.toContain('t.co');
  });

  it('community-archive shape: matched by tweetId, even when another post has the same time and a matching start', () => {
    const r = parseXArchive([
      { name: 'tweets.js', content: tweetsJs(0, [tweet('20', CUT, 'Wed Oct 10 20:19:24 +0000 2018'), tweet('21', CUT, 'Wed Oct 10 20:19:24 +0000 2018')]) },
      { name: 'note-tweet.js', content: notesJs([resultsNote('901', LONG, '21')]) },
    ]);
    expect(texts(r).sort()).toEqual([LONG, xText(CUT)].sort());
    expect(texts(r).filter((t) => t === LONG)).toHaveLength(1);
    expect(r.ok && r.skipped.unmatched).toBe(0);
  });

  it('a reply\'s note text, which holds no leading @mentions, still matches the reply in tweets.js', () => {
    const r = parseXArchive([
      { name: 'tweets.js', content: tweetsJs(0, [tweet('30', `@someone @other ${CUT}`, 'Wed Oct 10 20:19:24 +0000 2018')]) },
      { name: 'note-tweet.js', content: notesJs([coreNote('902', LONG, '2018-10-10T20:19:24.000Z')]) },
    ]);
    expect(texts(r)).toEqual([LONG]);
  });

  it('matched by text alone when no post has the note\'s time: one candidate is replaced, never doubled', () => {
    const r = parseXArchive([
      { name: 'tweets.js', content: tweetsJs(0, [tweet('40', CUT, 'Wed Oct 10 20:19:25 +0000 2018')]) },
      { name: 'note-tweet.js', content: notesJs([coreNote('903', LONG, 'not a date')]) },
    ]);
    expect(texts(r)).toEqual([LONG]);
    expect(r.ok && r.items[0].date).toBe('2018-10-10T20:19:25.000Z');
  });

  it('ambiguous: a note two posts could match is left unmatched, counted and noted; both posts keep their text and none is doubled', () => {
    const r = parseXArchive([
      { name: 'tweets.js', content: tweetsJs(0, [tweet('50', CUT, 'Wed Oct 10 20:19:24 +0000 2018'), tweet('51', CUT, 'Wed Oct 10 20:19:24 +0000 2018')]) },
      { name: 'note-tweet.js', content: notesJs([coreNote('904', LONG, '2018-10-10T20:19:24.000Z')]) },
    ]);
    expect(texts(r)).toEqual([xText(CUT), xText(CUT)]);
    expect(r.ok && r.skipped.unmatched).toBe(1);
    expect(r.ok && r.notes.join(' ')).toMatch(/could not be matched to exactly one post/);
  });

  it('ambiguous the other way: two notes matching one post by text are both left out; a match by id outranks a match by text', () => {
    const other = `${LONG} And a different ending.`;
    const two = parseXArchive([
      { name: 'tweets.js', content: tweetsJs(0, [tweet('60', CUT, 'Wed Oct 10 20:19:24 +0000 2018')]) },
      { name: 'note-tweet.js', content: notesJs([coreNote('905', LONG, '2018-10-10T20:19:24.000Z'), coreNote('906', other, '2018-10-10T20:19:24.000Z')]) },
    ]);
    expect(texts(two)).toEqual([xText(CUT)]);
    expect(two.ok && two.skipped.unmatched).toBe(2);
    const ranked = parseXArchive([
      { name: 'tweets.js', content: tweetsJs(0, [tweet('61', CUT, 'Wed Oct 10 20:19:24 +0000 2018')]) },
      { name: 'note-tweet.js', content: notesJs([coreNote('907', LONG, '2018-10-10T20:19:24.000Z'), resultsNote('908', other, '61')]) },
    ]);
    expect(texts(ranked)).toEqual([other]);
    expect(ranked.ok && ranked.skipped.unmatched).toBe(1);
  });

  it('a note no post matches is a post of its own, dated by its createdAt; a repeated note (split parts, repeated picks) counts once', () => {
    const solo = 'A long post whose tweets.js copy is not in the files chosen. '.repeat(6).trim();
    const r = parseXArchive([
      { name: 'tweets.js', content: tweetsJs(0, [tweet('70', 'A short post.', 'Thu Oct 11 08:00:00 +0000 2018')]) },
      { name: 'data/note-tweet.js', content: notesJs([coreNote('909', solo, '2018-10-12T01:02:03.000+10:00')]) },
      { name: 'data/note-tweet-part1.js', content: notesJs([coreNote('909', solo, '2018-10-12T01:02:03.000+10:00')], 1) },
    ]);
    expect(r.ok && r.items).toEqual([{ text: solo, date: '2018-10-11T15:02:03.000Z' }, { text: 'A short post.', date: '2018-10-11T08:00:00.000Z' }]);
  });

  it('unreadable and empty notes are counted, never guessed; a note matched by id to a repost is left out with it; deleted-note-tweet.js is not read', () => {
    const r = parseXArchive([
      { name: 'tweets.js', content: tweetsJs(0, [tweet('80', CUT, 'Wed Oct 10 20:19:24 +0000 2018'), tweet('81', 'RT @rival: their long words…', 'Wed Oct 10 21:00:00 +0000 2018')]) },
      { name: 'note-tweet.js', content: notesJs([null, { noteTweet: { noteTweetId: '1', core: { text: 7 } } }, { noteTweet: { noteTweetId: '2' } }, coreNote('3', '   ', '2018-10-10T20:19:24.000Z'), resultsNote('4', 'Their long words, in full.', '81')]) },
      { name: 'deleted-note-tweet.js', content: notesJs([coreNote('5', LONG, '2018-10-10T20:19:24.000Z')]) },
    ]);
    expect(r.ok && r.skipped).toEqual({ reposts: 1, empty: 1, unreadable: 3, unmatched: 0 });
    expect(texts(r)).toEqual([xText(CUT)]);
  });

  it('split posts files (tweets-part1.js) still work with note-tweet.js, and an unreadable note-tweet.js is refused with what to choose', () => {
    const r = parseXArchive([
      { name: 'data/tweets.js', content: tweetsJs(0, [tweet('90', 'First part post', 'Fri Jan 01 00:00:00 +0000 2016')]) },
      { name: 'data/tweets-part1.js', content: tweetsJs(1, [tweet('91', CUT, 'Wed Oct 10 20:19:24 +0000 2018')]) },
      { name: 'data/note-tweet.js', content: notesJs([resultsNote('910', LONG, '91')]) },
    ]);
    expect(texts(r)).toEqual([LONG, 'First part post']);
    expect(parseXArchive([{ name: 'tweets.js', content: tweetsJs(0, []) }, { name: 'note-tweet.js', content: 'window.YTD.note_tweet.part0 = [{' }]))
      .toMatchObject({ ok: false, reason: expect.stringMatching(/note-tweet\.js/) });
  });

  it('noteKey and isoInstant compare only what the evidence supports', () => {
    expect(noteKey('@a @b Hello &amp; welcome…  https://t.co/x1 ')).toBe('Hello & welcome');
    expect(noteKey('Line one\n\nline two')).toBe('Line one line two');
    expect(isoInstant('2018-10-10T20:19:24.000Z')).toBe(Date.UTC(2018, 9, 10, 20, 19, 24));
    expect(isoInstant('2018-10-10T20:19:24+10:00')).toBe(Date.UTC(2018, 9, 10, 10, 19, 24));
    expect(isoInstant('2018-02-30T00:00:00Z')).toBeUndefined();
    expect(isoInstant('Wed Oct 10 20:19:24 +0000 2018')).toBeUndefined();
  });
});

describe('LinkedIn export (Shares.csv and Profile.csv, parsed in the browser)', () => {
  const shares = [
    'Date,ShareLink,ShareCommentary,SharedUrl,MediaUrl,Visibility',
    '2024-02-01 09:00:00,https://www.linkedin.com/feed/update/urn:li:share:1,"We build brand kits, then prove them.\nTwo lines, ""quoted"".",,,MEMBER_NETWORK',
    '2024-03-01 09:00:00,https://www.linkedin.com/feed/update/urn:li:share:2,,https://example.com/article,,MEMBER_NETWORK',
    '2024-04-01 09:00:00,https://www.linkedin.com/feed/update/urn:li:share:3,JamJam is based in Melbourne.,,,PUBLIC',
  ].join('\r\n');
  const profile = [
    'First Name,Last Name,Maiden Name,Address,Birth Date,Headline,Summary,Industry,Zip Code,Geo Location,Twitter Handles,Websites,Instant Messengers',
    'Ada,Example,,1 Private Street,1 Jan 1980,Founder at JamJam,We help brands prove what they say.,Software Development,3011,"Melbourne, Victoria, Australia",,[COMPANY:https://jamjam.tech],',
  ].join('\n');

  it('reads posts newest first with their link and date, skips reshares with no words, and keeps quoted commas, quotes and line breaks', () => {
    const r = parseLinkedInExport([{ name: 'Shares.csv', content: shares }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.items).toEqual([
      { text: 'JamJam is based in Melbourne.', date: '2024-04-01T09:00:00.000Z', url: 'https://www.linkedin.com/feed/update/urn:li:share:3' },
      { text: 'We build brand kits, then prove them.\nTwo lines, "quoted".', date: '2024-02-01T09:00:00.000Z', url: 'https://www.linkedin.com/feed/update/urn:li:share:1' },
    ]);
    expect(r.skipped.empty).toBe(1);
  });

  it('keeps only the profile\'s work fields; name, address, birth date and postcode never leave the browser', () => {
    const r = parseLinkedInExport([{ name: 'Profile.csv', content: profile }, { name: 'Shares.csv', content: shares }]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const fields = r.items.filter((i) => i.label);
    expect(fields).toEqual([
      { text: 'Founder at JamJam', label: 'Headline' },
      { text: 'We help brands prove what they say.', label: 'Summary' },
      { text: 'Software Development', label: 'Industry' },
      { text: 'Melbourne, Victoria, Australia', label: 'Geo Location' },
      { text: '[COMPANY:https://jamjam.tech]', label: 'Websites' },
    ]);
    // Profile fields come first, so a long post history cut to the read step's limit never drops them.
    expect(r.items[0]).toMatchObject({ label: 'Headline' });
    expect(r.items.slice(fields.length).every((i) => !i.label)).toBe(true);
    const sent = JSON.stringify(socialPayload(r));
    for (const secret of ['Ada', 'Private Street', '1980', '3011']) expect(sent).not.toContain(secret);
  });

  it('finds the header row below a preamble and matches column names without regard to case', () => {
    const r = parseLinkedInExport([{ name: 'exports/SHARES.CSV', content: 'Notes:\n"Exported posts"\n\ndate,sharelink,sharecommentary\n2024-01-01,https://www.linkedin.com/x,Hello there' }]);
    expect(r.ok && r.items).toEqual([{ text: 'Hello there', date: '2024-01-01T00:00:00.000Z', url: 'https://www.linkedin.com/x' }]);
  });

  it('refuses a file without the text column, an unclosed quote, or no LinkedIn file at all', () => {
    expect(parseLinkedInExport([{ name: 'Shares.csv', content: 'a,b\n1,2' }])).toMatchObject({ ok: false, reason: expect.stringMatching(/ShareCommentary/) });
    expect(parseLinkedInExport([{ name: 'Shares.csv', content: 'Date,ShareCommentary\n2024-01-01,"open' }])).toMatchObject({ ok: false });
    expect(parseLinkedInExport([{ name: 'Connections.csv', content: 'x' }])).toMatchObject({ ok: false, reason: expect.stringMatching(/Shares\.csv/) });
  });

  it('a link that is not a linkedin.com address is not kept as the post\'s address', () => {
    const r = parseLinkedInExport([{ name: 'Shares.csv', content: 'Date,ShareLink,ShareCommentary\n2024-01-01,javascript:alert(1),Hi' }]);
    expect(r.ok && r.items[0].url).toBeUndefined();
  });

  it('CSV and dates follow RFC 4180 and the export\'s date form exactly', () => {
    expect(parseCsv('a,"b,c"\r\n"d""e",f\n')).toEqual([['a', 'b,c'], ['d"e', 'f']]);
    expect(linkedInDate('2024-02-30 00:00:00')).toBeUndefined();
    expect(linkedInDate('15/01/2024')).toBeUndefined();
  });
});
