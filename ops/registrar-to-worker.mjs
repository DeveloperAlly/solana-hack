// One-off: copy the funded devnet Registrar key from the SPIKE_KEYS Actions secret into the Worker secret
// REGISTRAR_KEY (owner go-ahead 2026-10-07, recorded at https://github.com/DeveloperAlly/solana-hack/issues/4#issuecomment-6039702428;
// funded in devnet-spike run 4, commit 43b8634). Prints only the public address, never key material.
// Usage (CI): SPIKE_KEYS=... EXPECTED_ADDRESS=... CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node ops/registrar-to-worker.mjs
// Lives outside web/ so merging it does not also trigger web-deploy.yml (no second Worker mutation at the same time).
import { createPrivateKey, createPublicKey } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const fail = (m) => { console.error(`registrar-to-worker FAILED: ${m}`); process.exit(1); };
const raw = process.env.SPIKE_KEYS;
const expected = process.env.EXPECTED_ADDRESS;
if (!raw) fail('SPIKE_KEYS is empty');
if (!expected) fail('EXPECTED_ADDRESS is empty');

let key;
try { key = JSON.parse(raw).registrar; } catch { fail('SPIKE_KEYS is not JSON'); }
if (!Array.isArray(key) || key.length !== 64 || !key.every((b) => Number.isInteger(b) && b >= 0 && b <= 255)) {
  fail('SPIKE_KEYS.registrar is not a 64-byte array');
}
const bytes = Uint8Array.from(key);
const seed = bytes.slice(0, 32);
const pub = bytes.slice(32);

// The stored public half must be the one the secret half derives (PKCS#8 Ed25519 prefix + 32-byte seed).
const pkcs8 = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.from(seed)]);
const derived = Buffer.from(createPublicKey(createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' })).export({ format: 'jwk' }).x, 'base64url');
if (!derived.equals(Buffer.from(pub))) fail('the public half does not match the secret half');

const A = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
let n = 0n; for (const b of pub) n = (n << 8n) + BigInt(b);
let address = ''; while (n > 0n) { address = A[Number(n % 58n)] + address; n /= 58n; }
for (const b of pub) { if (b === 0) address = '1' + address; else break; }
console.log(`registrar address: ${address}`);
if (address !== expected) fail(`address ${address} is not the expected ${expected}`);

// Same Wrangler version as web/package-lock.json.
const r = spawnSync('npx', ['--yes', 'wrangler@4.147.0', 'secret', 'put', 'REGISTRAR_KEY', '--name', 'waterlily'], {
  input: JSON.stringify(Array.from(bytes)),
  stdio: ['pipe', 'inherit', 'inherit'],
});
if (r.status !== 0) fail(`wrangler secret put exited ${r.status}`);
console.log('registrar-to-worker PASS: REGISTRAR_KEY on waterlily now holds the key for ' + address);
