// Eval configuration: the site and brand name the journeys type in. Nothing is defaulted here; the caller must say.
// Public CI passes a neutral site the project owns (.github/workflows/outcome-evals.yml). Runs against anyone's real
// site happen only outside the public repo, with EVAL_SITE and EVAL_BRAND_NAME set locally (see README.md).
let cached;
export function evalConfig() {
  if (cached) return cached;
  const site = (process.env.EVAL_SITE || '').trim();
  const brandName = (process.env.EVAL_BRAND_NAME || '').trim();
  const missing = [!site && 'EVAL_SITE', !brandName && 'EVAL_BRAND_NAME'].filter(Boolean);
  if (missing.length) {
    console.error(`outcome evals: ${missing.join(' and ')} not set. Set EVAL_SITE to the site the journeys type in (https://...) and EVAL_BRAND_NAME to the brand name they type; public CI sets them in .github/workflows/outcome-evals.yml.`);
    process.exit(2);
  }
  let url;
  try { url = new URL(site.includes('://') ? site : `https://${site}`); } catch { console.error(`outcome evals: EVAL_SITE is not a web address: ${JSON.stringify(site)}`); process.exit(2); }
  cached = { site: url.origin, host: url.host, brandName };
  return cached;
}
