// Local workerd check (wrangler dev, no deploy): does @solana/kit + @solana/attestation run in the
// Workers runtime? GET /?ua=0|1 runs the read-only health action using keys from .dev.vars.
// ua=1 sends an explicit user-agent header (run 1 got HTTP 403 from the public devnet RPC without one).
import { run } from "./actions.mjs";
export default {
  async fetch(req, env) {
    const ua = new URL(req.url).searchParams.get("ua") === "1";
    const cfg = ua ? { headers: { "user-agent": "waterlily-devnet-spike/0.1" } } : undefined;
    const t0 = Date.now();
    try {
      const out = await run("health", JSON.parse(env.KEYS_JSON), env.RPC_URL, cfg);
      return Response.json({ ok: true, ua, ms: Date.now() - t0, out });
    } catch (e) { return Response.json({ ok: false, ua, error: String(e?.message ?? e), context: e?.context ?? null }, { status: 500 }); }
  },
};
