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
  // EOL is CR, LF or CRLF (RFC 9309 §2.2 ABNF: NL = %x0D / %x0A / %x0D.0A).
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

function ruleMatches(rulePath: string, path: string) {
  const anchored = rulePath.endsWith('$');
  const body = (anchored ? rulePath.slice(0, -1) : rulePath).split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`).test(path);
}

/** True when the rules allow this path (path plus query, as in the URL). */
export function allowedBy(rules: Rule[], pathAndQuery: string): boolean {
  const path = normalisePath(pathAndQuery);
  let best: Rule | null = null;
  for (const r of rules) {
    if (!ruleMatches(r.path, path)) continue;
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)) best = r;
  }
  return best ? best.allow : true;
}

export type RobotsCheck = { state: 'rules'; rules: Rule[] } | { state: 'none' } | { state: 'unreachable' };

/** Reads robots.txt for an origin. Never throws. */
export async function fetchRobots(origin: string, fetcher: typeof fetch = fetch): Promise<RobotsCheck> {
  try {
    const res = await fetcher(`${origin}/robots.txt`, { redirect: 'follow', signal: AbortSignal.timeout(5000), headers: { 'user-agent': USER_AGENT } });
    if (res.status >= 400 && res.status < 500) return { state: 'none' };
    if (!res.ok) return { state: 'unreachable' };
    // Read up to the parsing limit in bytes, then decode: a limit in characters could stop short of 500 KiB.
    const bytes = new Uint8Array(await res.arrayBuffer()).subarray(0, ROBOTS_MAX_BYTES);
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
