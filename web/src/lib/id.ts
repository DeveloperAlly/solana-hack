// Unique ids for items created in the browser (list rows added by a person), so keys never collide after a
// removal (Codex review on PR #79: ids built from a list's length repeat). A monotonic counter per page load.
let counter = 0;

/** A new id, unique for this page load, e.g. "src-7". */
export function uniqueId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
