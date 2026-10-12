import { HttpError, type Env } from './env';
import type { NamedSchema } from './schema';

/** Optional settings for one call. Existing callers pass none and get the request they always sent. */
export interface ChatOptions {
  /**
   * A reply schema, sent as an OpenRouter structured output: response_format {type: 'json_schema', json_schema:
   * {name, strict: true, schema}}, with provider.require_parameters: true so the request is routed only to providers
   * that support every parameter in it (https://openrouter.ai/docs/guides/features/structured-outputs;
   * https://openrouter.ai/docs/guides/routing/provider-selection). The Free Models Router filters its pool to models
   * supporting the request's structured output (https://openrouter.ai/docs/guides/routing/routers/free-router).
   * Enforcement still varies by provider, so callers must check the reply (schema.ts schemaError).
   */
  schema?: NamedSchema;
}

export interface ChatResult { text: string; model: string; usage?: { promptTokens?: number; completionTokens?: number } }

/** The request body for one call (exported for tests, which check the exact shape sent). */
export function chatBody(model: string, system: string, user: string, opts: ChatOptions = {}) {
  return {
    model,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    ...(opts.schema
      ? { response_format: { type: 'json_schema', json_schema: { name: opts.schema.name, strict: true, schema: opts.schema.schema } }, provider: { require_parameters: true } }
      : {}),
  };
}

/** OpenRouter's answer when no provider meets the request's routing requirements (HTTP 503 in its error codes:
 * https://openrouter.ai/docs/api/reference/errors-and-debugging). */
export const NO_PROVIDER = 'no free AI model that supports this request is available right now, try again later';

// OpenRouter chat completions (OpenRouter quickstart): POST /api/v1/chat/completions, Bearer key,
// reply in choices[0].message.content, token counts in usage. Default model is the Free Models Router
// (openrouter/free), which picks an available free model that supports the request; it costs nothing
// (https://openrouter.ai/docs/guides/routing/routers/free-router).
export async function chat(env: Env, system: string, user: string, opts: ChatOptions = {}): Promise<ChatResult> {
  if (!env.OPENROUTER_API_KEY) throw new HttpError(503, 'the AI model is not configured');
  const model = env.OPENROUTER_MODEL || 'openrouter/free';
  let last = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'content-type': 'application/json',
        'X-OpenRouter-Title': 'JamJam',
      },
      body: JSON.stringify(chatBody(model, system, user, opts)),
    });
    if (res.status === 429 || res.status >= 500) {
      last = res.status;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; model?: string; usage?: { prompt_tokens?: number; completion_tokens?: number }; error?: { message?: string; code?: unknown } };
    if (!res.ok) {
      // Logging policy: status and provider error code only. Provider messages are never logged, so prompt content cannot reach the logs.
      console.error('llm error', { status: res.status, code: typeof data.error?.code === 'string' || typeof data.error?.code === 'number' ? data.error.code : undefined });
      throw new HttpError(502, 'the AI model returned an error');
    }
    const text = data.choices?.[0]?.message?.content ?? '';
    console.log('llm call', { model: data.model ?? model, chars: text.length, schema: opts.schema?.name });
    const usage = data.usage ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens } : undefined;
    return { text, model: data.model ?? model, ...(usage ? { usage } : {}) };
  }
  console.error('llm retries exhausted', { status: last });
  // A 503 with a required schema means no provider honours the request: not a rate limit, so the run must not pause
  // for the daily allowance (engine/runner.ts treats only the busy message as a rate limit).
  if (last === 503 && opts.schema) throw new HttpError(503, NO_PROVIDER);
  throw new HttpError(502, 'the AI model is busy, try again in a minute');
}

/** Pulls the first JSON object or array out of a model reply. */
export function parseJson<T>(text: string): T {
  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (start < 0 || end < start) throw new HttpError(502, 'the AI model reply was not usable, try again');
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    throw new HttpError(502, 'the AI model reply was not usable, try again');
  }
}

// No-AI-slop rules applied to every draft (ADR-003): plain, specific, no filler.
export const SLOP_RULES = `Write plainly and specifically. Never use these words or phrases: "delve", "unlock", "unleash", "elevate", "seamless", "game-changer", "revolutionize", "cutting-edge", "in today's fast-paced world", "landscape", "tapestry", "empower", "leverage", "synergy", "robust", "harness", "navigate the", "it's not just", "more than just". No em dashes. No hype, no exclamation marks, no rhetorical questions. Do not invent facts, numbers, customers or awards.`;
