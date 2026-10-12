// Embedded database acceptance for #114. Run instructions and scope: ../2026-10-13_sql-acceptance.md
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const { PGlite } = await import(process.env.PGLITE_MODULE ? pathToFileURL(resolve(process.env.PGLITE_MODULE)).href : '@electric-sql/pglite');
import { readFileSync, readdirSync } from 'node:fs';
const db = new PGlite();
const lines = [];
function record(value) { lines.push(value); console.log(value); }
await db.exec('create schema auth; create table auth.users(id uuid primary key); create role anon; create role authenticated; create role service_role;');
record(JSON.stringify((await db.query('select version(), encode(sha256(convert_to(\'probe\',\'UTF8\')),\'hex\') digest')).rows[0]));
const dir = fileURLToPath(new URL('../../spec/db/', import.meta.url));
for (const name of readdirSync(dir).filter(x => /^\d+.*\.sql$/.test(x)).sort()) {
 try { const sql = readFileSync(`${dir}/${name}`, 'utf8'); await db.exec(sql); record(`APPLIED ${name} sha256=${createHash('sha256').update(sql).digest('hex')}`); }
 catch(e) { record(`FAILED ${name}: ${e.message}`); throw e; }
}

const user='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', brand='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const s1='cccccccc-cccc-4ccc-8ccc-ccccccccccc1', s2='cccccccc-cccc-4ccc-8ccc-ccccccccccc2';
const e1='dddddddd-dddd-4ddd-8ddd-ddddddddddd1', e2='dddddddd-dddd-4ddd-8ddd-ddddddddddd2', correction='dddddddd-dddd-4ddd-8ddd-ddddddddddd3';
await db.exec(`insert into auth.users values ('${user}'); insert into brands(id,owner_id,name) values ('${brand}','${user}','SQL proof'); insert into sources(id,brand_id,url) values ('${s1}','${brand}','https://one.example'),('${s2}','${brand}','https://two.example');`);
await db.exec(`insert into evidence(id,brand_id,source_id,section,claim,quote,origin,trust,review_status,match,fact_key,source_key) values ('${e1}','${brand}','${s1}','purpose','Makes bridges','Makes bridges','source','owned','approved','exact','bridges','one.example'),('${e2}','${brand}','${s2}','purpose','Makes bridges','Makes bridges','source','owned','approved','exact','bridges','two.example');`);
async function assert(sql, expected, label) { const got=(await db.query(sql)).rows[0]; if(JSON.stringify(got)!==JSON.stringify(expected)) throw Error(`${label}: ${JSON.stringify(got)}`); record(`PASS ${label}: ${JSON.stringify(got)}`); }
await assert(`select confidence from evidence where id='${e1}'`,{confidence:'high'},'corroboration high');
await db.exec(`update evidence set review_status='rejected' where id='${e2}'`);
await assert(`select confidence from evidence where id='${e1}'`,{confidence:'medium'},'rejected corroboration downgrades');
await db.exec(`update evidence set review_status='approved' where id='${e2}'; select delete_source('${brand}','${s2}');`);
await assert(`select confidence from evidence where id='${e1}'`,{confidence:'medium'},'deleted corroboration downgrades');
await db.exec(`insert into evidence(id,brand_id,section,claim,origin,trust,review_status,edited_from) values ('${correction}','${brand}','purpose','Owner wording','owner_answer','owner_answer','approved','${e1}');`);
await assert(`select review_status from evidence where id='${e1}'`,{review_status:'rejected'},'correction rejects original');
await db.exec(`update evidence set review_status='approved' where id='${e1}'`);
await assert(`select count(*)::int as n from evidence where id='${correction}'`,{n:0},'restoring source removes correction');
const run='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
await db.exec(`insert into runs(id,brand_id,kind,workflow_version,status,metered_budget) values ('${run}','${brand}','extract_facts',1,'running',5); select consume_metered('${run}',1); update runs set status='superseded' where id='${run}';`);
try { await db.query(`select consume_metered('${run}',1)`); throw Error('superseded run accepted'); } catch(e) { if(e.code!=='PT409') throw e; record('PASS superseded meter refuses PT409'); }
await assert(`select metered_used from runs where id='${run}'`,{metered_used:1},'superseded attempt consumes zero');

await db.exec(`insert into sources(brand_id,url) select '${brand}', 'https://extra.example/'||n from generate_series(1,6) n;`);
const reserve=`select admit_run(p_brand=>'${brand}',p_kind=>'extract_facts',p_version=>1,p_executor=>'workflows',p_progress=>'{}',p_created_by=>'${user}',p_planned=>61,p_budget=>1000,p_run_rate=>100,p_spend_cap=>10,p_client_key=>null,p_client_cap=>20,p_ttl_s=>120,p_source_cap=>8)`;
const reservation=(await db.query(reserve)).rows[0].admit_run;
record('PASS first admission reserves last source slot');
try { await db.query(reserve); throw Error('second admission exceeded source cap'); } catch(e) { if(e.code!=='PT429'||e.message!=='save your brand to read more sources') throw e; record('PASS second admission refuses reserved source slot PT429'); }
await db.exec(`delete from runs where id='${reservation.id}';`);
await db.query(reserve); record('PASS released reservation frees source capacity');
record('Limitations: single-process embedded PostgreSQL 18.6; auth/roles are stubs; no Supabase RLS client integration, concurrent sessions, Cloudflare bindings or chain calls verified here.');
record('ALL 001–014 migrations applied to embedded PostgreSQL with auth schema and role stubs. No production mutation.');
await db.close();
