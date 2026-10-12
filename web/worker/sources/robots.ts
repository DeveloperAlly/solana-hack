/**
 * robots.txt check for the site adapter, following RFC 9309 (https://www.rfc-editor.org/rfc/rfc9309.html):
 * - the group for our product token applies, else the "*" group (§2.2.1); groups for one agent are combined;
 * - the most specific (longest) matching rule wins, and allow wins a tie (§2.2.2);
 * - "*" matches any characters and "$" anchors the end (§2.2.3);
 * - robots.txt "unavailable" (4xx) means no restrictions (§2.3.1.3); "unreachable" (5xx or a network error) means
 *   assume complete disallow (§2.3.1.4).
 */
export const BOT_TOKEN = 'jamjambot';
export const USER_AGENT = 'JamJamBot/0.1 (+https://jamjam.tech)';

interface Rule { allow: boolean; path: string }

export function parseRobots(body: string, token = BOT_TOKEN): Rule[] {
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let cur: { agents: string[]; rules: Rule[] } | null = null;
  let lastWasAgent = false;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'user-agent') {
      if (!cur || !lastWasAgent) { cur = { agents: [], rules: [] }; groups.push(cur); }
      cur.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((key === 'allow' || key === 'disallow') && cur) {
      lastWasAgent = false;
      // An empty Disallow allows everything, so it adds no rule.
      if (value) cur.rules.push({ allow: key === 'allow', path: value });
    } else {
      lastWasAgent = false;
    }
  }
  const mine = groups.filter((g) => g.agents.some((a) => a !== '*' && token.startsWith(a.split('/')[0])));
  const chosen = mine.length ? mine : groups.filter((g) => g.agents.includes('*'));
  return chosen.flatMap((g) => g.rules);
}

function ruleMatches(rulePath: string, path: string) {
  const anchored = rulePath.endsWith('$');
  const body = (anchored ? rulePath.slice(0, -1) : rulePath).split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*');
  return new RegExp(`^${body}${anchored ? '$' : ''}`).test(path);
}

/** True when the rules allow this path (path plus query, as in the URL). */
export function allowedBy(rules: Rule[], pathAndQuery: string): boolean {
  let best: Rule | null = null;
  for (const r of rules) {
    if (!ruleMatches(r.path, pathAndQuery)) continue;
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
    return { state: 'rules', rules: parseRobots((await res.text()).slice(0, 500_000)) };
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
