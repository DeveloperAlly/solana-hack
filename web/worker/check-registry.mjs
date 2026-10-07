// S0 done-when (3): one Registrar-signed devnet registration from the deployed app, verified
// independently over RPC. Usage (deploy workflow): BASE_URL, SELFTEST_TOKEN, EXPECTED_REGISTRAR,
// REGISTRAR_KEY (only to prove it never leaks) [, CHECK_RPC_URL].
import { mkdirSync, writeFileSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSolanaRpc, address } from '@solana/kit';
import { findCredentialPda, findSchemaPda, fetchSchema, fetchMaybeAttestation, deserializeAttestationData } from '@solana/attestation';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'proof');
mkdirSync(out, { recursive: true });
const base = (process.env.BASE_URL || '').replace(/\/$/, '');
const token = process.env.SELFTEST_TOKEN || '';
const expected = process.env.EXPECTED_REGISTRAR || '';
const secret = process.env.REGISTRAR_KEY || '';
const rpcUrl = process.env.CHECK_RPC_URL || 'https://api.devnet.solana.com';
if (!base || !token || !expected || !secret) throw new Error('BASE_URL, SELFTEST_TOKEN, EXPECTED_REGISTRAR and REGISTRAR_KEY are required');

const lines = [];
const log = (s) => (lines.push(`${new Date().toISOString()} ${s}`), console.log(s));
const fail = (s) => { throw new Error('ASSERT FAILED: ' + s); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function retry(fn, label, tries = 6) {
  for (let i = 1; ; i++) {
    try { return await fn(); } catch (e) {
      if (i >= tries) throw e;
      log(`retry ${i} ${label}: ${String(e?.message ?? e).slice(0, 120)}`); await sleep(5000 * i);
    }
  }
}

let ok = false;
try {
  // 1. Health names the expected Registrar (public address only).
  const health = await (await fetch(base + '/api/health')).json();
  if (health.registrar !== expected) fail(`health registrar ${health.registrar} != ${expected}`);
  log(`PASS: /api/health registrar = ${expected}, rpcConfigured = ${health.rpcConfigured}`);

  // 2. No token, no registration.
  const noAuth = await fetch(base + '/api/registry/selftest', { method: 'POST' });
  if (noAuth.status !== 401) fail(`selftest without token returned ${noAuth.status}, expected 401`);
  log('PASS: POST /api/registry/selftest without token -> 401');

  // 3. With the deploy-run token: one registration.
  const res = await fetch(base + '/api/registry/selftest', { method: 'POST', headers: { authorization: `Bearer ${token}` } });
  const text = await res.text();
  // Check for secret material before anything is logged (the log is posted to a public issue).
  if (text.includes(secret) || text.includes(token)) fail('response contains secret material');
  log(`selftest -> HTTP ${res.status}: ${text.slice(0, 1500)}`);
  if (res.status !== 200) fail(`selftest returned ${res.status}`);
  const r = JSON.parse(text);
  log(`PASS: registration tx ${r.explorer}`);

  // 4. Independent check from Node over RPC: the transaction succeeded and the attestation matches.
  const rpc = createSolanaRpc(rpcUrl);
  const tx = await retry(() => rpc.getTransaction(r.signature, { maxSupportedTransactionVersion: 0, commitment: 'confirmed', encoding: 'json' }).send(), 'getTransaction');
  if (!tx) fail('transaction not found over RPC');
  if (tx.meta?.err) fail('transaction error ' + JSON.stringify(tx.meta.err));
  log(`PASS: RPC getTransaction ${r.signature}: slot ${tx.slot}, err = null`);
  const [credential] = await findCredentialPda({ authority: address(expected), name: 'WATERLILY' });
  const [schema] = await findSchemaPda({ credential, name: 'WL-KIT', version: 1 });
  const a = await retry(() => fetchMaybeAttestation(rpc, address(r.attestation)), 'fetchAttestation');
  if (!a.exists) fail('attestation account not found');
  if (a.data.signer !== expected) fail(`attestation signer ${a.data.signer} != Registrar ${expected}`);
  if (a.data.credential !== credential) fail('credential mismatch');
  if (a.data.schema !== schema) fail('schema mismatch');
  const s = await retry(() => fetchSchema(rpc, schema), 'fetchSchema');
  const data = deserializeAttestationData(s.data, a.data.data);
  if (data.hash !== r.readBack?.data?.hash || !String(data.hash).startsWith('sha256:')) fail('attestation hash mismatch');
  log(`PASS: attestation ${r.attestationExplorer}: signer = Registrar, credential WATERLILY, schema WL-KIT v1, data = ${JSON.stringify(data)}`);

  // 5. The Registrar key is not in the shipped files.
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  const leaks = walk(join(here, '..', 'dist')).filter((f) => readFileSync(f, 'utf8').includes(secret));
  if (leaks.length) fail('Registrar key found in ' + leaks.join(', '));
  log('PASS: Registrar key not present in dist/ or in any API response');
  ok = true;
  log('check-registry PASS');
} catch (e) {
  log(`check-registry FAILED: ${e.message}`);
} finally {
  writeFileSync(join(out, 'deployed-registry.txt'), lines.join('\n') + '\n');
}
process.exit(ok ? 0 : 1);
