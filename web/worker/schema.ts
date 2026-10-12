// JSON Schema for model replies (issue #64). One schema object is both sent to the model (OpenRouter structured
// outputs, response_format json_schema with strict: true) and checked here against the reply, so the two cannot drift.
// OpenRouter says strict enforcement varies by provider and "exact compliance is not guaranteed on every endpoint"
// (https://openrouter.ai/docs/guides/features/structured-outputs), so the Worker never trusts a reply it has not
// checked. Only the keywords strict modes share are used: every property required, additionalProperties false, enum
// for closed lists (OpenAI's strict-mode rules, "Supported schemas": https://developers.openai.com/api/docs/guides/structured-outputs).
// Length and count limits are not sent (not every strict mode accepts them); the step code enforces them after this.

export type JsonSchema =
  | { type: 'object'; properties: Record<string, JsonSchema>; required: string[]; additionalProperties: false; description?: string }
  | { type: 'array'; items: JsonSchema; description?: string }
  | { type: 'string'; enum?: readonly string[]; description?: string }
  | { type: 'boolean'; description?: string };

/**
 * A named schema, as response_format.json_schema takes it, plus optional limits checked after the schema (counts the
 * schema does not send). A reply over a limit is refused as a whole, like a reply that breaks the schema.
 */
/** limits: checks past the shape; `context.user` is the request the reply answers (the engine passes it). */
export interface NamedSchema { name: string; schema: JsonSchema; limits?: (value: unknown, context?: { user: string }) => string | null }

/** The first way `value` breaks `schema`, as "path: problem", or null when it conforms. Never includes the value. */
export function schemaError(schema: JsonSchema, value: unknown, path = '$'): string | null {
  switch (schema.type) {
    case 'object': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return `${path}: not an object`;
      const o = value as Record<string, unknown>;
      for (const k of schema.required) if (!(k in o)) return `${path}.${k}: missing`;
      for (const k of Object.keys(o)) {
        const p = schema.properties[k];
        if (!p) return `${path}.${k}: not allowed`;
        const e = schemaError(p, o[k], `${path}.${k}`);
        if (e) return e;
      }
      return null;
    }
    case 'array': {
      if (!Array.isArray(value)) return `${path}: not an array`;
      for (let i = 0; i < value.length; i++) {
        const e = schemaError(schema.items, value[i], `${path}[${i}]`);
        if (e) return e;
      }
      return null;
    }
    case 'string':
      if (typeof value !== 'string') return `${path}: not a string`;
      return schema.enum && !schema.enum.includes(value) ? `${path}: not one of the allowed values` : null;
    case 'boolean':
      return typeof value === 'boolean' ? null : `${path}: not a boolean`;
  }
}
