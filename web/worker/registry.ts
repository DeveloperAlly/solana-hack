// Registry: writes SAS attestations signed by the server Registrar (ADR-006, backend map G-SAS).
// Only hashes and ids go onchain (R27). The Registrar is payer, credential authority and signer;
// brands never sign. Settled by the devnet spike in spike/ (2026-10-08).
import {
  createSolanaRpc, createKeyPairSignerFromBytes, generateKeyPairSigner, pipe,
  createTransactionMessage, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions, signTransactionMessageWithSigners, getSignatureFromTransaction,
  getBase64EncodedWireTransaction,
  type Address, type KeyPairSigner, type Instruction,
} from '@solana/kit';
import {
  findCredentialPda, findSchemaPda, findAttestationPda, getCreateAttestationInstruction,
  fetchSchema, fetchMaybeAttestation, serializeAttestationData, deserializeAttestationData,
} from '@solana/attestation';

// Created by the spike under this Registrar; see backend map G-SAS.
export const CREDENTIAL_NAME = 'WATERLILY';
export const KIT_SCHEMA = { name: 'WL-KIT', version: 1 } as const;
export const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
export const explorerAddress = (a: string) => `https://explorer.solana.com/address/${a}?cluster=devnet`;

type Rpc = ReturnType<typeof createSolanaRpc>;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Thrown for any unusable REGISTRAR_KEY. Its message is fixed: parser messages can quote parts of the key. */
export class RegistrarKeyError extends Error {
  constructor() { super('REGISTRAR_KEY is not a valid 64-byte keypair array'); this.name = 'RegistrarKeyError'; }
}

export async function registrarFromSecret(secret: string): Promise<KeyPairSigner> {
  let bytes: Uint8Array;
  try {
    const arr = JSON.parse(secret) as unknown;
    if (!Array.isArray(arr) || arr.length !== 64 || !arr.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) throw new Error();
    bytes = new Uint8Array(arr as number[]);
  } catch {
    throw new RegistrarKeyError(); // never rethrow the parser's message
  }
  try {
    return await createKeyPairSignerFromBytes(bytes);
  } catch {
    throw new RegistrarKeyError();
  }
}

// HTTP polling only; no WebSocket subscriptions in Workers (backend map G-SAS).
async function confirm(rpc: Rpc, sig: string, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { value } = await rpc.getSignatureStatuses([sig as never]).send();
    const st = value[0];
    if (st?.err) throw new Error('transaction failed: ' + JSON.stringify(st.err, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));
    if (st && (st.confirmationStatus === 'confirmed' || st.confirmationStatus === 'finalized')) return;
    await sleep(1500);
  }
  throw new Error('confirm timeout ' + sig);
}

/**
 * A write whose outcome is known to be "did not land": the RPC rejected it (a JSON-RPC error, negative code, such as
 * a failed preflight) or it executed with an error. Anything else after sending (timeouts, transport errors, a failed
 * read-back) is ambiguous: the attestation may exist, so callers must not retry blindly.
 */
export class NotLanded extends Error {}
const isRpcRejection = (e: unknown) => { const c = (e as { context?: { __code?: unknown } })?.context?.__code; return typeof c === 'number' && c < 0; };

async function sign(rpc: Rpc, feePayer: KeyPairSigner, ixs: Instruction[]) {
  const { value: bh } = await rpc.getLatestBlockhash().send();
  const msg = pipe(createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(bh, tx),
    (tx) => appendTransactionMessageInstructions(ixs, tx));
  const signed = await signTransactionMessageWithSigners(msg);
  return { signature: getSignatureFromTransaction(signed) as string, wire: getBase64EncodedWireTransaction(signed) };
}

async function submit(rpc: Rpc, signed: { signature: string; wire: ReturnType<typeof getBase64EncodedWireTransaction> }) {
  try {
    await rpc.sendTransaction(signed.wire, { encoding: 'base64' }).send();
  } catch (e) {
    if (isRpcRejection(e)) throw new NotLanded('rejected by the RPC', { cause: e });
    throw e;
  }
  try {
    await confirm(rpc, signed.signature);
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('transaction failed')) throw new NotLanded(e.message, { cause: e });
    throw e;
  }
}

async function send(rpc: Rpc, feePayer: KeyPairSigner, ixs: Instruction[]) {
  const signed = await sign(rpc, feePayer, ixs);
  await submit(rpc, signed);
  return signed.signature;
}

export type KitFields = { brand_id: string; hash: string; kit_version: string; approver: string; domain_verified: string };

/**
 * Signs one WL-KIT attestation without sending it, so the caller can record the signature and attestation address
 * first. Nothing reaches Solana until send() is called.
 */
export async function prepareKitAttestation(rpcUrl: string, registrar: KeyPairSigner, fields: KitFields) {
  const rpc = createSolanaRpc(rpcUrl);
  const [credential] = await findCredentialPda({ authority: registrar.address, name: CREDENTIAL_NAME });
  const [schema] = await findSchemaPda({ credential, name: KIT_SCHEMA.name, version: KIT_SCHEMA.version });
  const s = await fetchSchema(rpc, schema);
  const nonce = (await generateKeyPairSigner()).address;
  const [attestation] = await findAttestationPda({ credential, schema, nonce });
  const signed = await sign(rpc, registrar, [getCreateAttestationInstruction({
    payer: registrar, authority: registrar, credential, schema, attestation, nonce, expiry: 0,
    data: serializeAttestationData(s.data, fields),
  })]);
  return {
    signature: signed.signature, attestation: attestation as string, explorer: explorerTx(signed.signature),
    /** Sends and confirms. Throws NotLanded when it certainly failed; any other error leaves the outcome unknown. */
    send: () => submit(rpc, signed),
  };
}

/**
 * Reads an attestation from Solana and checks it is ours: it exists, the Registrar signed it, it uses the WATERLILY
 * credential and WL-KIT schema, and its hash field matches. 'unavailable' means the RPC could not be read.
 */
export async function readKitAttestation(rpcUrl: string, registrarAddress: Address, attestation: string, hash: string): Promise<'verified' | 'mismatch' | 'missing' | 'unavailable'> {
  try {
    const rpc = createSolanaRpc(rpcUrl);
    const [credential] = await findCredentialPda({ authority: registrarAddress, name: CREDENTIAL_NAME });
    const [schema] = await findSchemaPda({ credential, name: KIT_SCHEMA.name, version: KIT_SCHEMA.version });
    const a = await fetchMaybeAttestation(rpc, attestation as Address, { commitment: 'confirmed' });
    if (!a.exists) return 'missing';
    if (a.data.signer !== registrarAddress || a.data.credential !== credential || a.data.schema !== schema) return 'mismatch';
    const s = await fetchSchema(rpc, schema);
    const data = deserializeAttestationData(s.data, a.data.data) as Record<string, unknown>;
    return data.hash === hash ? 'verified' : 'mismatch';
  } catch {
    return 'unavailable';
  }
}

/** Writes one WL-KIT attestation and reads it back. Throws if the read-back does not match. */
export async function registerKitAttestation(rpcUrl: string, registrar: KeyPairSigner, fields: KitFields) {
  const rpc = createSolanaRpc(rpcUrl);
  const [credential] = await findCredentialPda({ authority: registrar.address, name: CREDENTIAL_NAME });
  const [schema] = await findSchemaPda({ credential, name: KIT_SCHEMA.name, version: KIT_SCHEMA.version });
  const s = await fetchSchema(rpc, schema);
  const nonce = (await generateKeyPairSigner()).address;
  const [attestation] = await findAttestationPda({ credential, schema, nonce });
  const signature = await send(rpc, registrar, [getCreateAttestationInstruction({
    payer: registrar, authority: registrar, credential, schema, attestation, nonce, expiry: 0,
    data: serializeAttestationData(s.data, fields),
  })]);
  // Read at the same commitment confirm() waited for; retry briefly while the RPC node catches up.
  let a = await fetchMaybeAttestation(rpc, attestation, { commitment: 'confirmed' });
  for (let i = 0; !a.exists && i < 5; i++) {
    await sleep(1500);
    a = await fetchMaybeAttestation(rpc, attestation, { commitment: 'confirmed' });
  }
  if (!a.exists) throw new Error('attestation not found after confirm');
  const data = deserializeAttestationData(s.data, a.data.data) as Record<string, unknown>;
  const readBack = {
    signerIsRegistrar: a.data.signer === registrar.address,
    credentialMatches: a.data.credential === credential,
    schemaMatches: a.data.schema === schema,
    // Every supplied field must come back exactly as written.
    fieldsMatch: (Object.keys(fields) as (keyof KitFields)[]).every((k) => data[k] === fields[k]),
    data,
  };
  if (!readBack.signerIsRegistrar || !readBack.credentialMatches || !readBack.schemaMatches || !readBack.fieldsMatch)
    throw new Error('read-back mismatch: ' + JSON.stringify(readBack));
  return {
    signature, explorer: explorerTx(signature),
    attestation: attestation as Address, attestationExplorer: explorerAddress(attestation),
    credential: credential as Address, schema: schema as Address, registrar: registrar.address, readBack,
  };
}
