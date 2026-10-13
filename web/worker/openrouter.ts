// What /api/health reports about the OpenRouter key (GET https://openrouter.ai/api/v1/key, documented at
// https://openrouter.ai/docs/api/api-reference/api-keys/get-current-api-key and https://openrouter.ai/docs/api/reference/limits).
// Only two fields leave this module: is_free_tier (whether the account has ever bought credits) and
// free_model_daily_requests.limit (free-model requests allowed per UTC day: 50 under 10 credits purchased, 1,000 at
// or above; chosen by credits purchased, independently of is_free_tier). Never the key, its label or its usage.
export interface OpenRouterKeyInfo { isFreeTier: boolean | null; freeModelDailyLimit: number | null }

export async function openRouterKeyInfo(key: string | undefined): Promise<OpenRouterKeyInfo> {
  const none = { isFreeTier: null, freeModelDailyLimit: null };
  if (!key) return none;
  try {
    const res = await fetch('https://openrouter.ai/api/v1/key', { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return none;
    const d = ((await res.json()) as { data?: { is_free_tier?: unknown; free_model_daily_requests?: { limit?: unknown } } }).data;
    const limit = d?.free_model_daily_requests?.limit;
    return {
      isFreeTier: typeof d?.is_free_tier === 'boolean' ? d.is_free_tier : null,
      freeModelDailyLimit: typeof limit === 'number' && Number.isInteger(limit) && limit >= 0 ? limit : null,
    };
  } catch {
    return none;
  }
}
