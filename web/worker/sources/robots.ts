/**
 * robots.txt check for the site adapter, following RFC 9309 (https://www.rfc-editor.org/rfc/rfc9309.html):
 * - the group for our product token applies, else the "*" group (§2.2.1); groups for one agent are combined;
 * - the most specific (longest) matching rule wins, and allow wins a tie (§2.2.2);
 * - "*" matches any characters and "$" anchors the end (§2.2.3);
 * - robots.txt "unavailable" (4xx) means no restrictions (§2.3.1.3); "unreachable" (5xx or a network error) means
 *   assume complete disallow (§2.3.1.4).
 */
// The product token: letters, "_" and "-" only, and a substring of the User-Agent we send (RFC 9309 §2.2.1).
export const BOT_TOKEN = 'JamJamBot';
// RFC 9309 §2.5: the parsing limit MUST be at least 500 kibibytes (512,000 bytes).
export const ROBOTS_MAX_BYTES = 500 * 1024;
export const USER_AGENT = 'JamJamBot/0.1 (+https://jamjam.tech)';

interface Rule { allow: boolean; path: string }

/**
 * The product token named on a user-agent line: its leading identifier characters (RFC 9309 §2.2 ABNF: identifier is
 * letters, "_" and "-"), lower-cased, so "JamJamBot/1.0" names jamjambot. "*" stays "*".
 */
const agentToken = (value: string) => (value.trim().startsWith('*') ? '*' : (value.trim().match(/^[A-Za-z_-]+/)?.[0] ?? '').toLowerCase());

export function parseRobots(body: string, token = BOT_TOKEN): Rule[] {
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let cur: { agents: string[]; rules: Rule[] } | null = null;
  // A group is one or more user-agent lines followed by rules; it ends only at a user-agent line that comes after a
  // rule (RFC 9309 §2.1). Other records, such as Sitemap, never end a group (§2.2.4).
  let sawRule = false;
  // RFC 9309 §2.2 ends a line with CR, LF or CRLF, so a CR-only file is read line by line too (PR #71 review).
  for (const raw of body.split(/\r\n|\r|\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'user-agent') {
      if (!cur || sawRule) { cur = { agents: [], rules: [] }; groups.push(cur); sawRule = false; }
      cur.agents.push(agentToken(value));
    } else if ((key === 'allow' || key === 'disallow') && cur) {
      // Rules before the first user-agent line belong to no group and are ignored (§2.2.2).
      sawRule = true;
      // An empty Disallow allows everything, so it adds no rule (but it still ends the user-agent list).
      if (value) cur.rules.push({ allow: key === 'allow', path: normalisePath(value) });
    }
  }
  // Groups are matched on the whole product token, case-insensitively (§2.2.1); groups for it are combined.
  const mine = groups.filter((g) => g.agents.includes(token.toLowerCase()));
  const chosen = mine.length ? mine : groups.filter((g) => g.agents.includes('*'));
  return chosen.flatMap((g) => g.rules);
}

/**
 * The form RFC 9309 §2.2.2 compares in (https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.2): a percent-encoded
 * octet is decoded when it is an unreserved character (RFC 3986 §2.3: ALPHA, DIGIT, "-", ".", "_", "~"), so
 * /%62%61%7A matches /baz; any other encoded octet stays encoded, with upper-case hex; characters outside ASCII are
 * percent-encoded as UTF-8 (/foo/bar/ツ becomes /foo/bar/%E3%83%84). Applied to rule paths and request paths alike.
 * "*" and "$" in a rule are pattern characters and are left as they are.
 */
export function normalisePath(p: string): string {
  return p
    .replace(/%([0-9a-fA-F]{2})/g, (_m, hex: string) => {
      const ch = String.fromCharCode(parseInt(hex, 16));
      return /^[A-Za-z0-9\-._~]$/.test(ch) ? ch : `%${hex.toUpperCase()}`;
    })
    .replace(/[^\x00-\x7F]+/gu, (run) => encodeURIComponent(run));
}

/**
 * Whether a rule path matches, with "*" for any run of characters and a closing "$" for the end of the path. Matched
 * without regular expressions, in linear passes: each literal piece between wildcards is found at its leftmost place
 * after the previous one, which never needs backtracking, so a hostile robots.txt cannot burn the Worker's CPU
 * (PR #71 review).
 */
export function ruleMatches(rulePath: string, path: string): boolean {
  const anchored = rulePath.endsWith('$');
  const parts = (anchored ? rulePath.slice(0, -1) : rulePath).split('*');
  if (!path.startsWith(parts[0])) return false;
  let pos = parts[0].length;
  if (parts.length === 1) return anchored ? path.length === pos : true;
  for (let i = 1; i < parts.length - 1; i++) {
    const at = path.indexOf(parts[i], pos);
    if (at === -1) return false;
    pos = at + parts[i].length;
  }
  const last = parts[parts.length - 1];
  return anchored ? path.length - last.length >= pos && path.endsWith(last) : path.indexOf(last, pos) !== -1;
}

/** True when the rules allow this path (path plus query, as in the URL). */
export function allowedBy(rules: Rule[], pathAndQuery: string): boolean {
  const path = normalisePath(pathAndQuery);
  // RFC 9309 §2.2.2: the most specific match wins, the one with the most octets; the pattern operators "*" and a
  // closing "$" are not octets of the path, so they do not count (PR #71 review). On a tie, allow wins.
  const octets = (p: string) => p.replace(/\*/g, '').replace(/\$$/, '').length;
  let best: Rule | null = null;
  for (const r of rules) {
    if (!ruleMatches(r.path, path)) continue;
    if (!best || octets(r.path) > octets(best.path) || (octets(r.path) === octets(best.path) && r.allow)) best = r;
  }
  return best ? best.allow : true;
}

export type RobotsCheck = { state: 'rules'; rules: Rule[] } | { state: 'none' } | { state: 'unreachable' };

/** Reads at most `max` bytes of a response body, then cancels the rest of the stream. */
export async function readCapped(res: Response, max: number): Promise<Uint8Array> {
  const out = new Uint8Array(max);
  let n = 0;
  const reader = res.body?.getReader();
  if (!reader) return out.subarray(0, 0);
  try {
    while (n < max) {
      const { done, value } = await reader.read();
      if (done) break;
      const take = Math.min(value.length, max - n);
      out.set(value.subarray(0, take), n);
      n += take;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return out.subarray(0, n);
}

/** Reads robots.txt for an origin. Never throws. */
export async function fetchRobots(origin: string, fetcher: typeof fetch = fetch): Promise<RobotsCheck> {
  try {
    const res = await fetcher(`${origin}/robots.txt`, { redirect: 'follow', signal: AbortSignal.timeout(5000), headers: { 'user-agent': USER_AGENT } });
    if (res.status >= 400 && res.status < 500) return { state: 'none' };
    if (!res.ok) return { state: 'unreachable' };
    // Read up to the parsing limit in bytes, then decode: a limit in characters could stop short of 500 KiB. The body
    // is streamed and cancelled at the limit, so a huge or endless file never fills memory (PR #71 review).
    const bytes = await readCapped(res, ROBOTS_MAX_BYTES);
    return { state: 'rules', rules: parseRobots(new TextDecoder().decode(bytes)) };
  } catch {
    return { state: 'unreachable' };
  }
}

/** The robots decision for one URL, given what fetchRobots returned. */
export function robotsAllows(check: RobotsCheck, url: URL): boolean {
  if (check.state === 'none') return true;
  if (check.state === 'unreachable') return false;
  return allowedBy(check.rules, url.pathname + url.search);
}
