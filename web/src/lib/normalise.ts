/**
 * The canonical form a post is hashed and matched in, the same as the Worker's `normalise` (web/worker/posts.ts:42):
 * Unicode NFC, then every run of whitespace, line breaks included, becomes one space, trimmed. A post pasted through a
 * platform that rewraps lines still matches; changing any word does not. The browser keeps its own copy so screens
 * never import Worker code; src/lib/normalise.test.ts asserts the two agree.
 */
export const normalise = (s: string): string => s.normalize('NFC').replace(/\s+/g, ' ').trim();
