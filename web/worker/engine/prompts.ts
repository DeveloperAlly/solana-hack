// Prompt library (backlog X5, X14): prompts live in prompt_versions (spec/db/010), keyed by key and version and checked
// by hash, so a prompt changes without a deploy and every run step records exactly which prompt it used.
import { db } from '../db';
import { HttpError, sha256Hex, type Env } from '../env';

export interface Prompt { key: string; version: number; body: string; hash: string }

/**
 * The prompt to use: the pinned version when given, else the active one. The stored hash must match the body
 * ("sha256:" + hex of the UTF-8 body), so a row edited in place without a new version is refused rather than used
 * under the old version number.
 */
export async function loadPrompt(env: Env, key: string, version?: number): Promise<Prompt> {
  const f = `${db.eq('key', key)}&${version ? db.eq('version', String(version)) : db.eq('status', 'active')}&select=key,version,body,hash&order=version.desc&limit=1`;
  const [p] = await db.select<Prompt>(env, 'prompt_versions', f);
  if (!p) throw new HttpError(500, `prompt ${key} is missing`);
  if (p.hash !== 'sha256:' + (await sha256Hex(p.body))) {
    console.error('prompt hash mismatch', { key, version: p.version });
    throw new HttpError(500, `prompt ${key} failed its integrity check`);
  }
  return p;
}

/** Fills {{name}} placeholders. Every placeholder must have a value, so a renamed variable fails loudly. */
export function render(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    if (!(k in vars)) throw new HttpError(500, `prompt variable ${k} has no value`);
    return vars[k];
  });
}
