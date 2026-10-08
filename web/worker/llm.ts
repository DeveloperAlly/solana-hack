import { HttpError, type Env } from './env';

// OpenRouter chat completions (OpenRouter quickstart): POST /api/v1/chat/completions, Bearer key,
// reply in choices[0].message.content. Default model is the Auto Router (openrouter/auto).
export async function chat(env: Env, system: string, user: string): Promise<{ text: string; model: string }> {
  if (!env.OPENROUTER_API_KEY) throw new HttpError(503, 'the AI model is not configured');
  const model = env.OPENROUTER_MODEL || 'openrouter/auto';
  let last = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'content-type': 'application/json',
        'X-OpenRouter-Title': 'Waterlily',
      },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
    });
    if (res.status === 429 || res.status >= 500) {
      last = `HTTP ${res.status}`;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; model?: string; error?: { message?: string; code?: unknown } };
    if (!res.ok) {
      // Logging policy: status and provider error code only. Provider messages are never logged, so prompt content cannot reach the logs.
      console.error('llm error', { status: res.status, code: typeof data.error?.code === 'string' || typeof data.error?.code === 'number' ? data.error.code : undefined });
      throw new HttpError(502, 'the AI model returned an error');
    }
    const text = data.choices?.[0]?.message?.content ?? '';
    console.log('llm call', { model: data.model ?? model, chars: text.length });
    return { text, model: data.model ?? model };
  }
  console.error('llm retries exhausted', last);
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
