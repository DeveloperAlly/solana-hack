// Applies the spec/db migrations the live database has not recorded yet, in file order, through the Supabase
// Management API, so a merge that needs a schema change carries it without anyone applying SQL by hand.
//
// Usage (from web/): SUPABASE_ACCESS_TOKEN=... SUPABASE_URL=https://<ref>.supabase.co node scripts/migrate.mjs [--dry-run]
//
// Sources, checked 2026-10-13:
//   List applied migrations: GET /v1/projects/{ref}/database/migrations -> [{ version, name }]
//     https://supabase.com/docs/reference/api/v1-list-migration-history
//   Apply one: POST /v1/projects/{ref}/database/migrations, body { query, name }
//     https://supabase.com/docs/reference/api/v1-apply-a-migration
//   The endpoint records the migration in the supabase_migrations schema and rolls the change back if it fails:
//     https://supabase.com/docs/guides/integrations/supabase-for-platforms ("Make database changes")
//
// Naming: spec/db/NNN_slug.sql is recorded as "slug_NNN", the names migrations 001-008 already carry on the live
// project (list_migrations on 2026-10-12: https://github.com/DeveloperAlly/solana-hack/pull/87#issuecomment-6126230111;
// STATE.md "Database"), so a file counts as applied when a recorded name ends in _NNN. A migration that fails is
// rolled back by the endpoint (guide above), so a later run applies it whole or not at all; nothing relies on files
// being safe to re-run.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = 'https://api.supabase.com/v1/projects';
const FILE = /^(\d{3})_([a-z0-9_]+)\.sql$/;

/**
 * The migration files in order: { file, number, name }. Files that are not SQL are ignored; a .sql file that does not
 * follow NNN_slug.sql is refused, so a misnamed migration can never be skipped while the run reports success.
 */
export function migrationFiles(names) {
  const bad = names.filter((n) => /\.sql$/i.test(n) && !FILE.test(n));
  if (bad.length) throw new Error(`not named NNN_slug.sql (lowercase, underscores): ${bad.join(', ')}`);
  return names
    .map((file) => FILE.exec(file))
    .filter(Boolean)
    .map((m) => ({ file: m[0], number: m[1], name: `${m[2]}_${m[1]}` }))
    .sort((a, b) => a.number.localeCompare(b.number));
}

/**
 * The files to apply, in order. Refuses (throws) when the database already holds a later migration than one that is
 * missing, or a number recorded twice, since applying out of order could run SQL against a schema it was not
 * written for.
 */
export function planMigrations(files, applied) {
  const done = new Set();
  for (const a of applied) {
    const m = /_(\d{3})$/.exec(String(a?.name ?? ''));
    if (m) done.add(m[1]);
  }
  const todo = files.filter((f) => !done.has(f.number));
  const highestDone = [...done].sort().at(-1);
  const early = todo.find((f) => highestDone && f.number < highestDone);
  if (early) throw new Error(`migration ${early.file} is missing but a later one (${highestDone}) is recorded; apply it by hand after review`);
  const numbers = files.map((f) => f.number);
  const dup = numbers.find((n, i) => numbers.indexOf(n) !== i);
  if (dup) throw new Error(`two files in spec/db share number ${dup}`);
  return todo;
}

/** The project ref from exactly https://<ref>.supabase.co, as the auth-config workflow accepts it. */
export function projectRef(url) {
  const m = /^https:\/\/([a-z0-9]{20})\.supabase\.co\/?$/.exec(String(url ?? ''));
  if (!m) throw new Error('SUPABASE_URL is not exactly https://<ref>.supabase.co');
  return m[1];
}

async function call(fetchImpl, token, method, url, body) {
  const res = await fetchImpl(url, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url.replace(/projects\/[a-z0-9]+/, 'projects/<ref>')} -> HTTP ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

/** Applies what is missing, one file at a time, stopping at the first failure. Returns the names applied. */
export async function migrate({ token, url, dir, dryRun = false, fetchImpl = fetch, log = console.log }) {
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN is required');
  const ref = projectRef(url);
  const files = migrationFiles(readdirSync(dir));
  const applied = await call(fetchImpl, token, 'GET', `${API}/${ref}/database/migrations`);
  const todo = planMigrations(files, Array.isArray(applied) ? applied : []);
  if (!todo.length) { log('database is up to date'); return []; }
  log(`to apply: ${todo.map((f) => f.file).join(', ')}`);
  if (dryRun) return [];
  const done = [];
  for (const f of todo) {
    await call(fetchImpl, token, 'POST', `${API}/${ref}/database/migrations`, { name: f.name, query: readFileSync(join(dir, f.file), 'utf8') });
    log(`applied ${f.file} as ${f.name}`);
    done.push(f.name);
  }
  return done;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'spec', 'db');
  migrate({ token: process.env.SUPABASE_ACCESS_TOKEN, url: process.env.SUPABASE_URL, dir, dryRun: process.argv.includes('--dry-run') })
    .catch((e) => { console.error(`::error::${e.message}`); process.exit(1); });
}
