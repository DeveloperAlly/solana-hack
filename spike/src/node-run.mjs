// Runs on a GitHub Actions runner. Generates 3 devnet keypairs, runs health/fund/sas/token,
// writes spike/out/results.json (public data only) and spike/out/keys.enc.json (keys encrypted
// to spike/spike-public.pem: RSA-OAEP-SHA256 wraps a random AES-256-GCM key). Also writes
// spike/.dev.vars (gitignored, never committed) for the workerd test.
import { generateKeyPairSync, publicEncrypt, randomBytes, createCipheriv, constants } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { run } from "./actions.mjs";

const RPC = process.env.RPC_URL || "https://api.devnet.solana.com";
const b64u = (s) => Buffer.from(s, "base64url");
function newKey() {
  const { privateKey } = generateKeyPairSync("ed25519");
  const jwk = privateKey.export({ format: "jwk" });
  return [...b64u(jwk.d), ...b64u(jwk.x)]; // 64 bytes: secret || public (Solana CLI format)
}
const keys = { registrar: newKey(), brand: newKey(), ambassador: newKey() };
const ser = (o) => JSON.stringify(o, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2);

mkdirSync("out", { recursive: true });
// Encrypt keys first, so they are recoverable even if later steps fail.
const aesKey = randomBytes(32), iv = randomBytes(12);
const c = createCipheriv("aes-256-gcm", aesKey, iv);
const ct = Buffer.concat([c.update(JSON.stringify(keys)), c.final()]);
const wrapped = publicEncrypt({ key: readFileSync("spike-public.pem"), padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: "sha256" }, aesKey);
writeFileSync("out/keys.enc.json", JSON.stringify({ alg: "RSA-OAEP-SHA256+AES-256-GCM", wrappedKey: wrapped.toString("base64"),
  iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), ciphertext: ct.toString("base64") }, null, 2));
writeFileSync(".dev.vars", `KEYS_JSON='${JSON.stringify(keys)}'\nRPC_URL=${RPC}\n`);

const results = { ranAt: new Date().toISOString(), rpc: RPC, steps: {} };
let ok = true;
for (const action of ["health", "fund", "sas", "token", "health"]) {
  const k = results.steps[action] ? action + "_final" : action;
  try { results.steps[k] = { status: "done", output: await run(action, keys, RPC) }; }
  catch (e) { ok = false; results.steps[k] = { status: "error", error: String(e?.message ?? e).slice(0, 500),
    context: e?.context ?? null, cause: e?.cause ? String(e.cause?.message ?? e.cause).slice(0, 500) : null, causeContext: e?.cause?.context ?? null }; }
  writeFileSync("out/results.json", ser(results));
  console.log(k, ser(results.steps[k]));
}
results.allOk = ok;
writeFileSync("out/results.json", ser(results));
