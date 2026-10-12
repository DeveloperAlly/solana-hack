// Chunking for fact extraction (issue #64; architecture §6.1 "Fact extraction with quote check": "Chunks of 2–4k
// tokens with source offsets"; one long call was rejected because models degrade as input grows). Pure and
// deterministic: the same text and settings always give the same chunks, so a retried or replayed step agrees with
// the first run.
import { MAX_QUOTE } from '../quote';

/**
 * Characters per token, for sizing only. OpenAI's rule of thumb for English is about 4 characters a token
 * (https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them). Free models behind
 * openrouter/free use different tokenizers, so token counts here are estimates and are labelled as such.
 */
export const CHARS_PER_TOKEN = 4;

export interface ChunkOptions {
  /** Preferred chunk length in characters (3k tokens). */
  target: number;
  /** Shortest chunk, except the last (2k tokens). */
  min: number;
  /** Longest chunk (4k tokens). */
  max: number;
  /** Characters shared with the previous chunk. More than MAX_QUOTE, so every quote short enough to store lies whole
   * inside at least one chunk. */
  overlap: number;
}
export const CHUNK_DEFAULTS: ChunkOptions = { target: 3000 * CHARS_PER_TOKEN, min: 2000 * CHARS_PER_TOKEN, max: 4000 * CHARS_PER_TOKEN, overlap: MAX_QUOTE + 100 };

export interface Chunk {
  index: number;
  /** Offsets into the stored source text: text === source.slice(start, end). */
  start: number;
  end: number;
  text: string;
  /** Estimated tokens (length / CHARS_PER_TOKEN, rounded up). */
  tokens: number;
}

// Break kinds, best first: a blank line, a line end, a sentence end, any whitespace.
const BREAKS = [/\n[^\S\n]*\n\s*/g, /\n\s*/g, /[.!?]["')\]]*\s+/g, /\s+/g];

/** The end of a chunk starting at `start`: the break nearest the target within [min, max], preferring better kinds. */
function chunkEnd(text: string, start: number, o: ChunkOptions): number {
  const lo = start + o.min;
  const hi = Math.min(text.length, start + o.max);
  const goal = start + o.target;
  for (const re of BREAKS) {
    let best = -1;
    re.lastIndex = lo;
    for (let m = re.exec(text); m && m.index < hi; m = re.exec(text)) {
      const end = m.index + m[0].length;
      if (end <= hi && (best < 0 || Math.abs(end - goal) < Math.abs(best - goal))) best = end;
      if (m[0].length === 0) re.lastIndex++;
    }
    if (best > start) return best;
  }
  // No whitespace at all in range (a long token): cut at the target, never inside a surrogate pair.
  let end = Math.min(goal, hi);
  if (/[\uD800-\uDBFF]/.test(text[end - 1] ?? '')) end--;
  return end;
}

/** Cuts text into chunks with offsets. Settings are checked so a bad definition fails loudly instead of looping. */
export function chunkText(text: string, options: Partial<ChunkOptions> = {}): Chunk[] {
  const o = { ...CHUNK_DEFAULTS, ...options };
  if (!(o.min > 0 && o.min <= o.target && o.target <= o.max && o.overlap >= 0 && o.overlap < o.min)) throw new Error('chunk settings must satisfy 0 < min <= target <= max and 0 <= overlap < min');
  const chunks: Chunk[] = [];
  let start = 0;
  while (start < text.length) {
    const end = text.length - start <= o.max ? text.length : chunkEnd(text, start, o);
    chunks.push({ index: chunks.length, start, end, text: text.slice(start, end), tokens: Math.ceil((end - start) / CHARS_PER_TOKEN) });
    if (end >= text.length) break;
    // The next chunk starts `overlap` characters back, moved further back (never forward) to the start of a word, so
    // the overlap is never shorter than asked.
    let next = end - o.overlap;
    const wordStart = text.slice(Math.max(start + 1, next - 100), next).search(/\s\S*$/);
    if (wordStart >= 0) next = Math.max(start + 1, next - 100) + wordStart + 1;
    // Never start on the second half of a surrogate pair.
    if (/[\uDC00-\uDFFF]/.test(text[next] ?? '')) next--;
    start = Math.max(next, start + 1);
  }
  return chunks;
}
