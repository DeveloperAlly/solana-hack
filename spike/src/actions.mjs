// Waterlily devnet spike: shared actions (Node runner and workerd test both import this).
// Devnet only. Keys are 64-byte arrays (secret||public), never committed in plaintext.
import {
  createSolanaRpc, createKeyPairSignerFromBytes, generateKeyPairSigner, pipe,
  createTransactionMessage, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions, signTransactionMessageWithSigners, getSignatureFromTransaction,
  getBase64EncodedWireTransaction, lamports,
} from "@solana/kit";
import {
  SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS, findCredentialPda, findSchemaPda, findAttestationPda,
  getCreateCredentialInstruction, getCreateSchemaInstruction, getCreateAttestationInstruction,
  fetchSchema, fetchMaybeAttestation, serializeAttestationData, deserializeAttestationData,
} from "@solana/attestation";
import { getCreateAccountInstruction, getTransferSolInstruction } from "@solana-program/system";
import {
  TOKEN_PROGRAM_ADDRESS, getMintSize, getInitializeMint2Instruction, findAssociatedTokenPda,
  getCreateAssociatedTokenIdempotentInstruction, getMintToCheckedInstruction,
} from "@solana-program/token";

export const explorer = (sig) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
export const explorerAddr = (a) => `https://explorer.solana.com/address/${a}?cluster=devnet`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function confirm(rpc, sig, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { value } = await rpc.getSignatureStatuses([sig]).send();
    const st = value[0];
    if (st?.err) throw new Error("tx failed: " + JSON.stringify(st.err, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
    if (st && (st.confirmationStatus === "confirmed" || st.confirmationStatus === "finalized")) return;
    await sleep(1500);
  }
  throw new Error("confirm timeout " + sig);
}
async function send(rpc, feePayer, ixs) {
  const { value: bh } = await rpc.getLatestBlockhash().send();
  const msg = pipe(createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(bh, tx),
    (tx) => appendTransactionMessageInstructions(ixs, tx));
  const signed = await signTransactionMessageWithSigners(msg);
  const sig = getSignatureFromTransaction(signed);
  await rpc.sendTransaction(getBase64EncodedWireTransaction(signed), { encoding: "base64" }).send();
  await confirm(rpc, sig);
  return sig;
}

// keys: { registrar: number[64], brand: number[64], ambassador: number[64] }
// rpcConfig is passed to createSolanaRpc (e.g. { headers: { "user-agent": "..." } }).
export async function run(action, keys, rpcUrl, rpcConfig) {
  const rpc = createSolanaRpc(rpcUrl, rpcConfig);
  const registrar = await createKeyPairSignerFromBytes(new Uint8Array(keys.registrar));
  const brand = await createKeyPairSignerFromBytes(new Uint8Array(keys.brand));
  const ambassador = await createKeyPairSignerFromBytes(new Uint8Array(keys.ambassador));
  const bal = async (a) => Number((await rpc.getBalance(a).send()).value) / 1e9;

  if (action === "health") {
    const sas = await rpc.getAccountInfo(SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS, { encoding: "base64" }).send();
    return {
      health: await rpc.getHealth().send(),
      keys: { registrar: registrar.address, brand: brand.address, ambassador: ambassador.address },
      sasProgram: { address: SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS, exists: !!sas.value, executable: sas.value?.executable ?? false },
      balancesSol: { registrar: await bal(registrar.address), brand: await bal(brand.address), ambassador: await bal(ambassador.address) },
    };
  }
  if (action === "fund") {
    // The devnet faucet is rate-limited per IP. Airdrop only to the Registrar (it pays all fees),
    // retrying with backoff, then the Registrar sends small amounts to the brand and ambassador.
    const out = { registrar: { ok: false, attempts: [] } };
    if ((await bal(registrar.address)) < 0.5) {
      for (const amt of [1_000_000_000n, 1_000_000_000n, 500_000_000n, 500_000_000n, 1_000_000_000n, 500_000_000n]) {
        try {
          const sig = await rpc.requestAirdrop(registrar.address, lamports(amt)).send();
          await confirm(rpc, sig);
          out.registrar = { ok: true, sol: Number(amt) / 1e9, tx: explorer(sig), attempts: out.registrar.attempts };
          break;
        } catch (e) { out.registrar.attempts.push(String(e?.message ?? e).slice(0, 200)); await sleep(15000); }
      }
    } else out.registrar = { ok: true, note: "already funded" };
    const rs = await bal(registrar.address);
    if (rs >= 0.3) {
      const top = [];
      if ((await bal(brand.address)) < 0.05) top.push(getTransferSolInstruction({ source: registrar, destination: brand.address, amount: 100_000_000n }));
      if ((await bal(ambassador.address)) < 0.01) top.push(getTransferSolInstruction({ source: registrar, destination: ambassador.address, amount: 20_000_000n }));
      if (top.length) out.topUpTx = explorer(await send(rpc, registrar, top));
    }
    out.balancesSol = { registrar: await bal(registrar.address), brand: await bal(brand.address), ambassador: await bal(ambassador.address) };
    return out;
  }
  if ((action === "sas" || action === "token") && (await bal(registrar.address)) < 0.05)
    throw new Error("skipped: Registrar has no devnet SOL (airdrop failed), so it cannot pay fees");
  if (action === "sas") {
    const out = {};
    const [credential] = await findCredentialPda({ authority: registrar.address, name: "WATERLILY" });
    if (!(await rpc.getAccountInfo(credential, { encoding: "base64" }).send()).value) {
      out.credentialTx = explorer(await send(rpc, registrar, [getCreateCredentialInstruction({
        payer: registrar, credential, authority: registrar, name: "WATERLILY", signers: [registrar.address] })]));
    }
    const [schema] = await findSchemaPda({ credential, name: "WL-KIT", version: 1 });
    if (!(await rpc.getAccountInfo(schema, { encoding: "base64" }).send()).value) {
      out.schemaTx = explorer(await send(rpc, registrar, [getCreateSchemaInstruction({
        payer: registrar, authority: registrar, credential, schema, name: "WL-KIT",
        description: "Waterlily brand kit approval (spike)",
        layout: [12, 12, 12, 12, 12], // 12 = String
        fieldNames: ["brand_id", "hash", "kit_version", "approver", "domain_verified"] })]));
    }
    const s = await fetchSchema(rpc, schema);
    const nonce = (await generateKeyPairSigner()).address;
    const [attestation] = await findAttestationPda({ credential, schema, nonce });
    const fields = { brand_id: "waterlily-spike", hash: "sha256:0000spike", kit_version: "1", approver: "spike", domain_verified: "false" };
    out.attestationTx = explorer(await send(rpc, registrar, [getCreateAttestationInstruction({
      payer: registrar, authority: registrar, credential, schema, attestation, nonce, expiry: 0,
      data: serializeAttestationData(s.data, fields) })]));
    const a = await fetchMaybeAttestation(rpc, attestation);
    out.readBack = a.exists ? {
      attestation: explorerAddr(attestation), nonce,
      signerIsRegistrar: a.data.signer === registrar.address,
      credentialMatches: a.data.credential === credential, schemaMatches: a.data.schema === schema,
      expiry: String(a.data.expiry), data: deserializeAttestationData(s.data, a.data.data),
    } : { exists: false };
    out.credential = explorerAddr(credential); out.schema = explorerAddr(schema);
    out.registrarSol = await bal(registrar.address);
    return out;
  }
  if (action === "token") {
    const mint = await generateKeyPairSigner();
    const space = BigInt(getMintSize());
    const rent = await rpc.getMinimumBalanceForRentExemption(space).send();
    const [brandAta] = await findAssociatedTokenPda({ owner: brand.address, mint: mint.address, tokenProgram: TOKEN_PROGRAM_ADDRESS });
    const sig = await send(rpc, registrar, [
      getCreateAccountInstruction({ payer: registrar, newAccount: mint, lamports: rent, space, programAddress: TOKEN_PROGRAM_ADDRESS }),
      getInitializeMint2Instruction({ mint: mint.address, decimals: 6, mintAuthority: registrar.address }),
      getCreateAssociatedTokenIdempotentInstruction({ payer: registrar, ata: brandAta, owner: brand.address, mint: mint.address }),
      getMintToCheckedInstruction({ mint: mint.address, token: brandAta, mintAuthority: registrar, amount: 1_000_000_000n, decimals: 6 }),
    ]);
    const tb = await rpc.getTokenAccountBalance(brandAta).send();
    return { testTokenMint: mint.address, decimals: 6, brandTokenAccount: brandAta, brandBalanceUi: tb.value.uiAmountString, tx: explorer(sig) };
  }
  throw new Error("unknown action " + action);
}
