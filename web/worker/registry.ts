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

/** Thrown for any unusable REGISTRAR_KEY. Its message is fixed by design: we never forward a parser's or library's error text, since we do not control what it includes. */
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

async function send(rpc: Rpc, feePayer: KeyPairSigner, ixs: Instruction[]) {
  const { value: bh } = await rpc.getLatestBlockhash().send();
  const msg = pipe(createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(bh, tx),
    (tx) => appendTransactionMessageInstructions(ixs, tx));
  const signed = await signTransactionMessageWithSigners(msg);
  const sig = getSignatureFromTransaction(signed);
  await rpc.sendTransaction(getBase64EncodedWireTransaction(signed), { encoding: 'base64' }).send();
  await confirm(rpc, sig);
  return sig as string;
}

export type KitFields = { brand_id: string; hash: string; kit_version: string; approver: string; domain_verified: string };

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
    // Booleans only: the decoded data holds brand and approver ids, which must not reach retained logs.
    throw new Error(`read-back mismatch: signer ${readBack.signerIsRegistrar}, credential ${readBack.credentialMatches}, schema ${readBack.schemaMatches}, fields ${readBack.fieldsMatch}`);
  return {
    signature, explorer: explorerTx(signature),
    attestation: attestation as Address, attestationExplorer: explorerAddress(attestation),
    credential: credential as Address, schema: schema as Address, registrar: registrar.address, readBack,
  };
}
