// Local workerd check (wrangler dev, no deploy): does @solana/kit + @solana/attestation run in the
// Workers runtime? GET /?a=health runs the read-only health action using keys from .dev.vars.
import { run } from "./actions.mjs";
export default {
  async fetch(req, env) {
    const a = new URL(req.url).searchParams.get("a") || "health";
    if (a !== "health") return new Response("read-only test", { status: 400 });
    const t0 = Date.now();
    try {
      const out = await run(a, JSON.parse(env.KEYS_JSON), env.RPC_URL);
      return Response.json({ ok: true, ms: Date.now() - t0, out });
    } catch (e) { return Response.json({ ok: false, error: String(e?.stack ?? e) }, { status: 500 }); }
  },
};
