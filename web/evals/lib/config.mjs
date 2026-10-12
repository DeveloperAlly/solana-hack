// Eval configuration. The test site and brand name identify a real brand, so they are never committed: they come
// from the environment (locally) or from the repository variables EVAL_SITE and EVAL_BRAND_NAME (in CI).
let cached;
export function evalConfig() {
  if (cached) return cached;
  const site = (process.env.EVAL_SITE || '').trim();
  const brandName = (process.env.EVAL_BRAND_NAME || '').trim();
  const missing = [!site && 'EVAL_SITE', !brandName && 'EVAL_BRAND_NAME'].filter(Boolean);
  if (missing.length) {
    console.error(`outcome evals: ${missing.join(' and ')} not set. Set EVAL_SITE to the site the journeys type in (https://...) and EVAL_BRAND_NAME to the brand name they type; in CI these are repository variables of the same names.`);
    process.exit(2);
  }
  let url;
  try { url = new URL(site.includes('://') ? site : `https://${site}`); } catch { console.error(`outcome evals: EVAL_SITE is not a web address: ${JSON.stringify(site)}`); process.exit(2); }
  cached = { site: url.origin, host: url.host, brandName };
  return cached;
}

/** Replaces the configured site and brand name in text bound for public places (PR comments). */
export function redactIdentity(text) {
  const { host, brandName } = evalConfig();
  const label = host.split('.')[0];
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let t = String(text ?? '');
  t = t.replace(new RegExp(`https?://(www\\.)?${esc(host)}/?`, 'gi'), 'the configured test site');
  t = t.replace(new RegExp(esc(host), 'gi'), 'the configured test site');
  if (label.length > 3) t = t.replace(new RegExp(esc(label), 'gi'), 'the configured test site');
  t = t.replace(new RegExp(esc(brandName), 'gi'), 'the configured brand name');
  return t;
}
