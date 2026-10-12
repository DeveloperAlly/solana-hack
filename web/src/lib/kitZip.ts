// A kit version's aDNA folder: which files it holds, its tree preview, and the zip built in the browser (backend map §4,
// row "Kit-Export": the zip is built client side, gap G-ZIP). Zipping: fflate (https://github.com/101arrowz/fflate).
import { strToU8, zipSync, type Zippable } from 'fflate';

export interface KitFile {
  /** Path inside the kit folder, e.g. "what/brand/02-purpose.md". */
  path: string;
  content: string;
  /** Include option that controls this file (e.g. "sources", "decisions", "missing"); always included when absent. */
  group?: string;
}

/** The files a download holds for the ticked include options. */
export function kitFiles(files: KitFile[], included: ReadonlySet<string>): KitFile[] {
  return files.filter((f) => !f.group || included.has(f.group));
}

/** Indented tree preview of a folder: two spaces per level, folders end in "/", in path order. */
export function kitTree(root: string, files: KitFile[]): string {
  const lines = [`${root}/`];
  const seen = new Set<string>();
  for (const f of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    const parts = f.path.split('/');
    parts.forEach((part, i) => {
      const key = parts.slice(0, i + 1).join('/');
      if (seen.has(key)) return;
      seen.add(key);
      lines.push(`${'  '.repeat(i + 1)}${part}${i < parts.length - 1 ? '/' : ''}`);
    });
  }
  return lines.join('\n');
}

/** Zip bytes for a kit folder: each file under `root/`, with its content. */
export function buildKitZip(root: string, files: KitFile[]): Uint8Array<ArrayBuffer> {
  const entries: Zippable = {};
  for (const f of files) entries[`${root}/${f.path}`] = strToU8(f.content);
  // Copied into a plain ArrayBuffer-backed array so it is a valid BlobPart.
  return new Uint8Array(zipSync(entries));
}

/** Hands a Blob to the browser as a download with the given file name. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
