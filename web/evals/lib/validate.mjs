// Strict validation of an eval run's results.json before anything from it reaches a public comment.
// The file can come from fork code, so nothing in it is trusted: unknown journey ids, unknown statuses, wrong types
// and oversized strings are rejected, and every string that is kept is escaped and has its links defused.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const STATUSES = ['PASS', 'FAIL', 'NOT DEPLOYED'];
export const SECTIONS = ['live', 'poc'];

/** Journey ids declared in the journeys/ sources (read as text, so validating never runs journey code). */
export function knownJourneyIds(dir = path.join(here, '..', 'journeys')) {
  const ids = new Set();
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.mjs'))) {
    for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/^\s*id: '([a-z0-9-]+)',$/gm)) ids.add(m[1]);
  }
  return ids;
}

/**
 * Text safe to place in GitHub markdown: bounded, links defused ("://" and "www." broken so nothing autolinks), and
 * every character outside a small plain set written as an HTML entity, so no markdown, HTML, mention (@), table pipe
 * or reference can be formed from it.
 */
export function safeText(value, max = 160) {
  let t = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (t.length > max) t = t.slice(0, max) + '…';
  t = t.replace(/:\/\//g, '[:]//').replace(/www\./gi, 'www[.]');
  return t.replace(/[^A-Za-z0-9 .,;:'"?=+%\-/]/g, (c) => `&#${c.codePointAt(0)};`);
}

const str = (v, max, name) => {
  if (typeof v !== 'string') throw new Error(`results: ${name} is not a string`);
  if (v.length > max) throw new Error(`results: ${name} is longer than ${max}`);
  return v;
};
const int = (v, name) => { if (!Number.isInteger(v) || v < 1 || v > 500) throw new Error(`results: ${name} is not a step number`); return v; };

/** Returns only the fields the comment shows, validated; throws on anything malformed. */
export function validateResults(raw, ids = knownJourneyIds()) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.journeys)) throw new Error('results: no journeys array');
  if (raw.journeys.length > 50) throw new Error('results: too many journeys');
  return raw.journeys.map((j, i) => {
    const id = str(j.id, 64, `journeys[${i}].id`);
    if (!ids.has(id)) throw new Error(`results: unknown journey id ${JSON.stringify(id)}`);
    if (!STATUSES.includes(j.status)) throw new Error(`results: ${id} has an unknown status`);
    if (!SECTIONS.includes(j.section)) throw new Error(`results: ${id} has an unknown section`);
    if (!Array.isArray(j.steps) || j.steps.length > 500) throw new Error(`results: ${id} has no valid steps`);
    const f = j.steps.find((s) => s && s.pass === false && !s.skipped);
    let firstFail = null;
    if (f) {
      const checks = Array.isArray(f.checks) ? f.checks.slice(0, 50) : [];
      const bad = checks.find((c) => c && c.pass === false) || { label: 'action', actual: f.error ?? '' };
      firstFail = {
        n: int(f.n, `${id} step number`),
        did: safeText(str(f.did, 2000, `${id} step did`), 140),
        expected: safeText(str(f.expected, 4000, `${id} step expected`), 160),
        label: safeText(str(bad.label ?? '', 500, `${id} check label`), 60),
        actual: safeText(str(String(bad.actual ?? ''), 20000, `${id} check actual`), 160),
      };
    }
    return { id, section: j.section, status: j.status, firstFail, missing: Array.isArray(j.missing) ? j.missing.slice(0, 10).map((m) => safeText(str(m, 80, `${id} missing`), 60)) : [] };
  });
}
