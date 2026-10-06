/**
 * Waterlily: shared clients (BOILERPLATE, proposed 2026-10-06). Not runnable code.
 *
 * Every external call below uses ONLY names verified on primary docs on 2026-10-06
 * (links in backend_map.md §9). Anything not verified is marked `TO VERIFY`.
 *
 * Runtime: the web app is Next.js on Cloudflare Workers via vinext. Route handlers
 * read bindings with `import { env } from "cloudflare:workers"`. Queue consumers,
 * cron and Workflows live in a SEPARATE plain Worker (pipeline/worker.ts), because
 * vinext doesn't document exporting queue()/scheduled()/WorkflowEntrypoint.
 *
 * Free-plan limit that shapes everything: 10 ms CPU per request, and per Workflow
 * step. Time spent waiting on fetch() does NOT count. So all heavy work is outbound
 * I/O (LLM, Exa, RPC). Avoid big in-Worker parsing and hashing loops.
 */

// ===================================================================== Supabase
/**
 * Two clients:
 *  - userClient(req): publishable key + the user's JWT → RLS applies. Use for reads.
 *  - adminClient(): secret key (sb_secret_...) → bypasses RLS. Use ONLY after the route
 *    handler has checked the caller's membership/role itself.
 * Verified: createClient(url, key, { auth: { persistSession:false, autoRefreshToken:false,
 * detectSessionInUrl:false } }) is the documented server-side admin pattern.
 * Alternative: @supabase/server (public beta since 2026-05-06) lists Workers as supported.
 * Not chosen because it's beta.
 */
export function adminClient(env: Env) {
  // return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  //   auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
/** Reads the Supabase access token from the Authorization header, then verifies it with auth.getUser(token). */
export async function requireUser(req: Request, env: Env): Promise<{ userId: string }> {
  // const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  // const { data, error } = await adminClient(env).auth.getUser(token)  → 401 if error
  return { userId: "" };
}
/** Role check: owner | approver | editor | partner | ambassador, from the memberships table. */
export async function requireRole(env: Env, userId: string, brandId: string, roles: string[]) {}

// ===================================================================== LLM gateway
/**
 * One gateway for every model call. The prompt registry provides `promptId@version`;
 * every call logs model, prompt version and tokens (§12.4).
 *
 * DEFAULT: OpenRouter. Verified:
 *  - POST https://openrouter.ai/api/v1/chat/completions, `Authorization: Bearer`
 *  - optional `HTTP-Referer` and `X-OpenRouter-Title` (the alias `X-Title` is still accepted)
 *  - body: model | models[] (fallback, tried in order; you are billed for the model
 *    that actually answers, which response.model reports), messages, temperature (0–2),
 *    max_tokens, stream, response_format {type:"json_schema", json_schema:{name,strict,schema}}
 *  - provider: { require_parameters:true } so we only route to providers that support
 *    structured output; data_collection:"deny" to avoid providers that train on prompts
 *  - errors: {error:{code,message,metadata}}. 402 = no credits, 429 = rate limited,
 *    503 = no provider matches
 *  - free models end in ":free". Limits: 20 req/min, and 50/day until the account has
 *    bought ≥10 credits, then 1000/day. ⚠ 50/day is not enough for a demo: buy 10 credits.
 *  - ⚠ Some free models state that free inputs may be used for training. Use
 *    data_collection:"deny". Brand intake is owner data.
 *
 * BRING-YOUR-OWN KEY (decision open, P4):
 *  - OpenRouter BYOK is ACCOUNT-level (keys added in OpenRouter settings), not per request,
 *    so it cannot hold one key per customer. Per-customer keys therefore mean calling
 *    the provider directly:
 *      Anthropic: POST https://api.anthropic.com/v1/messages, headers x-api-key,
 *                 anthropic-version: 2023-06-01; body {model, max_tokens, messages}
 *      OpenAI:    POST https://api.openai.com/v1/chat/completions, Authorization: Bearer
 *  - If keys stay in the browser, those calls run from the browser, so server-side
 *    background runs (ingest, drafting) cannot use the user's key. That is the trade-off
 *    to decide in P4.
 */
export type LlmCall = {
  promptId: string;            // e.g. "drafter.purpose@3"
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  jsonSchema?: object;         // enforce structured output where the model supports it
  brandId: string;             // used to load ai_settings (provider/model/byok)
};
export async function llm(env: Env, call: LlmCall): Promise<{ text: string; json?: any; model: string; usage: any }> {
  // 1. settings = ai_settings[brandId] ?? { provider: "openrouter", model: env.LLM_DEFAULT_MODEL /* ":free" id chosen in P0 */ }
  // 2. if provider === "openrouter":
  //    fetch("https://openrouter.ai/api/v1/chat/completions", { method:"POST",
  //      headers:{ Authorization:`Bearer ${env.OPENROUTER_API_KEY}`, "Content-Type":"application/json",
  //                "HTTP-Referer": env.APP_URL, "X-OpenRouter-Title": "Waterlily" },
  //      body: JSON.stringify({ models:[settings.model, env.LLM_FALLBACK_MODEL], messages: call.messages,
  //        temperature: 0.3, max_tokens: 2000,
  //        response_format: call.jsonSchema && { type:"json_schema", json_schema:{ name: call.promptId, strict:true, schema: call.jsonSchema } },
  //        provider:{ require_parameters: !!call.jsonSchema, data_collection:"deny" } }) })
  //    → data.choices[0].message.content; data.model; data.usage
  // 3. else call Anthropic or OpenAI directly with the decrypted BYOK key (only if stored server-side)
  // 4. insert a log row: brand, promptId, model, usage.total_tokens, latency
  // 5. on 429: back off and retry (inside a Workflow step, use step retries). On 402: surface "AI credits exhausted"
  return { text: "", model: "", usage: {} };
}

// ===================================================================== Search adapter (Exa)
/**
 * Owner decision 2026-10-06: Exa is the default search provider, behind this adapter so it can be swapped.
 * Verified:
 *  - POST https://api.exa.ai/search, header x-api-key (or Authorization: Bearer)
 *    body {query, type:"auto"|"fast"|"instant"|"deep-lite"|"deep"|"deep-reasoning", numResults (1–100),
 *          includeDomains, excludeDomains, category:"company"|"news"|..., contents:{text,highlights,summary}}
 *    ⚠ With category company or people, do NOT send dates or excludeDomains (returns 400).
 *    ⚠ "neural" and "keyword" are no longer `type` values.
 *  - POST https://api.exa.ai/contents {urls[], text, highlights, summary, maxAgeHours}. Fields are top-level.
 *    The response includes statuses[] per URL, which we use for Ingest-Error.
 *  - Pricing: free $10/month credits (+$10 onboarding). Search $7 per 1k (auto). Contents $1 per 1k pages per type.
 *  - Rate limits: /search 10 QPS, /contents 100 QPS. On 429, honour Retry-After.
 *  - Use plain fetch(): it is NOT verified that the exa-js SDK runs on Workers (it depends on dotenv and cross-fetch).
 * Uses: (1) Gate 2 competitor research (BB-4). (2) Fetching owned URLs during ingest, which avoids running
 * our own crawler. (3) Reading a URL pasted into Verify. (4) Lead signals (experimental, public only).
 */
export async function searchWeb(env: Env, q: { query: string; category?: string; includeDomains?: string[]; n?: number }) {
  // fetch("https://api.exa.ai/search", { method:"POST",
  //   headers:{ "x-api-key": env.EXA_API_KEY, "Content-Type":"application/json" },
  //   body: JSON.stringify({ query:q.query, type:"auto", numResults:q.n ?? 10, category:q.category,
  //     includeDomains:q.includeDomains, contents:{ highlights:true, text:{ maxCharacters: 2000 } } }) })
  // → results[{ title, url, publishedDate, text, highlights }], costDollars.total (log it)
}
export async function fetchPages(env: Env, urls: string[]) {
  // fetch("https://api.exa.ai/contents", { method:"POST", headers:{ "x-api-key": env.EXA_API_KEY, "Content-Type":"application/json" },
  //   body: JSON.stringify({ urls, text:true, maxAgeHours: 0 /* 0 = fetch fresh */ }) })
  // → results[{url,text}], statuses[{id,status,error}]. A failed status sets sources.status='failed' and sources.error
  // Note: robots.txt and platform terms are Exa's crawler policy, not ours. Social profile URLs (X, IG, TikTok)
  // are not ingested in v1 (§11).
}

// ===================================================================== DNS (domain verification)
/**
 * Onboard-2 "Check now": look up a TXT record at _waterlily.<domain> containing brands.domain_txt_token.
 * TO VERIFY in P0: use DNS-over-HTTPS (JSON) from a Worker, e.g. Cloudflare's resolver. The endpoint and
 * the `accept: application/dns-json` format were not checked in this pass.
 */
export async function lookupTxt(domain: string): Promise<string[]> { return []; }

// ===================================================================== Solana
/**
 * Verified (@solana/kit 8.4.0, @solana-program/memo 0.15.0, @solana-program/token 0.17.0):
 *  - Kit runs on WebCrypto Ed25519 and has a "workerd" export condition. Evidence, not a guarantee:
 *    TO VERIFY by a devnet smoke test from a deployed Worker.
 *  - Memo: getAddMemoInstruction({ memo }). The default program is MEMO_PROGRAM_ADDRESS (v4,
 *    Memo4c2p…). TO VERIFY that v4 is deployed on devnet; if not, pass
 *    { programAddress: LEGACY_MEMO_PROGRAM_ADDRESS_V3 }. Memo must be valid UTF-8 and is limited
 *    to ~566 bytes (v3 docs), so we write a compact string, never content.
 *  - USDC devnet mint 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU. Circle faucet: 20 USDC per 2 h per address.
 *    decimals = 6 (inferred from standard USDC, TO VERIFY with getMint).
 *  - RPC: the public devnet endpoint is rate-limited per IP and "not intended for production". Cloudflare
 *    shares egress IPs, so use a keyed RPC: Helius free plan (10 RPS, devnet URL
 *    https://devnet.helius-rpc.com/?api-key=KEY).
 *  - Explorer: https://explorer.solana.com/tx/<sig>?cluster=devnet
 *
 * WHO SIGNS (decision, see backend_map.md §7):
 *  - Registrations (identity, kit, claim, account, content, persona): a server-side REGISTRAR keypair pays and
 *    signs. Brands never sign. This matches §2 "Registrar (deterministic code)". The key is a Worker secret.
 *  - USDC payouts: the BRAND's wallet must sign (it is their money). Hackathon: the browser builds the
 *    transaction (transferChecked + create-ATA-idempotent + memo) and the brand's connected wallet signs and sends.
 *    The cap is enforced offchain in the payouts table. Escrow and Kora fee sponsorship are roadmap.
 */
export async function registerMemo(env: Env, memo: string): Promise<{ signature: string }> {
  // const rpc = createSolanaRpc(env.SOLANA_RPC_URL); const rpcSubscriptions = createSolanaRpcSubscriptions(env.SOLANA_WS_URL);
  // const registrar = await createKeyPairSignerFromBytes(new Uint8Array(JSON.parse(env.REGISTRAR_KEY)));
  //   ⚠ TO VERIFY: pkcs8 Ed25519 import works in workerd
  // const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  // const msg = pipe(createTransactionMessage({ version: 0 }),
  //   tx => setTransactionMessageFeePayerSigner(registrar, tx),
  //   tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  //   tx => appendTransactionMessageInstructions([getAddMemoInstruction({ memo })], tx));
  // const signed = await signTransactionMessageWithSigners(msg);
  // await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signed, { commitment: "confirmed" });
  // return { signature: getSignatureFromTransaction(signed) };
  return { signature: "" };
}
/** Memo format (proposed): "wl1|<type>|<brandId>|v<kitVersion>|sha256:<hex>". Under 566 bytes; no personal data. */
export function memoString(type: string, brandId: string, hash: string, kitVersion?: number) {
  return `wl1|${type}|${brandId}|v${kitVersion ?? 0}|sha256:${hash}`;
}
/** SHA-256 via WebCrypto (crypto.subtle.digest) over canonical JSON or normalised text. Cheap enough for 10 ms CPU. */
export async function sha256Hex(input: string): Promise<string> { return ""; }

// ===================================================================== Social publishing
/**
 * X (verified):
 *  - OAuth 2.0 PKCE. Authorize https://x.com/i/oauth2/authorize; token POST https://api.x.com/2/oauth2/token.
 *    Scopes: tweet.read tweet.write users.read offline.access (media.write for images).
 *    The access token lasts 2 h, and a refresh token is issued only with offline.access.
 *  - POST https://api.x.com/2/tweets {text, made_with_ai?, paid_partnership?} → 201 {data:{id,text}}
 *  - Pricing is pay-per-use: $0.015 per post, ⚠ $0.20 per post WITH A URL. No free tier; $20 starter credit.
 *  - Policy: show exactly what will be published; get express consent; NEVER compensate people for X actions.
 *    So X is a brand-owned publishing channel only, never a paid ambassador format.
 * LinkedIn (verified):
 *  - Self-serve "Share on LinkedIn" grants w_member_social (+ openid, profile via OIDC).
 *    Authorize https://www.linkedin.com/oauth/v2/authorization; token POST https://www.linkedin.com/oauth/v2/accessToken.
 *    Tokens last 60 days. No refresh token for non-partners, so the user reconnects.
 *  - The self-serve docs show POST https://api.linkedin.com/v2/ugcPosts (X-Restli-Protocol-Version: 2.0.0).
 *    The Posts API (POST /rest/posts + LinkedIn-Version) replaces it in the Marketing docs.
 *    ⚠ TO VERIFY: whether a w_member_social-only app can call /rest/posts. Build ugcPosts first.
 *  - Person URN: GET https://api.linkedin.com/v2/userinfo → sub. ⚠ TO VERIFY that sub == the urn:li:person id.
 *  - Org-page posting (w_organization_social) and post metrics need Community Management API approval.
 *    Not available in the hackathon.
 */
export async function publishToX(token: string, text: string) {}
export async function publishToLinkedIn(token: string, personUrn: string, text: string) {}

// ===================================================================== Queue + Workflow producers
/**
 * Verified: env.QUEUE.send(body) / sendBatch(); messages up to 128 KB. Free plan: 10k ops/day, 24 h retention.
 * env.WORKFLOW.create({ id?, params }) → instance.id / .status(). Free plan: 10 ms CPU per step, 1,024 steps,
 * 100 concurrent instances, 1 MiB per step result.
 * ⚠ TO VERIFY: the wrangler key for binding a Workflow defined in another Worker (likely `script_name`).
 */
export async function enqueue(env: Env, kind: string, payload: object) {}
export async function startWorkflow(env: Env, name: "ingest" | "draft" | "compileKit", params: object) {}

type Env = any;
