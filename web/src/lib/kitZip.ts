// Builds a kit version's aDNA folder as a zip in the browser (backend map §4, row "Kit-Export": the zip is built client
// side, gap G-ZIP). Zipping: fflate (https://github.com/101arrowz/fflate), zipSync over a path -> bytes map.
import { strToU8, zipSync, type Zippable } from 'fflate';

export interface KitZipInput {
  /** Folder tree, two spaces per level; directories end in "/"; text after two or more spaces is a comment. */
  tree: string;
  /** Lines written into MANIFEST.md (version, hash, included options). */
  manifest: string[];
}

/** Paths from an indented tree: "root/", "root/MANIFEST.md", "root/what/brand/" … */
export function treePaths(tree: string): string[] {
  const stack: string[] = [];
  const paths: string[] = [];
  for (const raw of tree.split('\n')) {
    if (!raw.trim()) continue;
    const depth = Math.floor((raw.length - raw.trimStart().length) / 2);
    const name = raw.trim().split(/\s{2,}/)[0];
    stack.length = depth;
    paths.push([...stack, name].join(''));
    if (name.endsWith('/')) stack[depth] = name;
  }
  return paths;
}

/** Zip bytes for a kit version: every folder in the tree, and MANIFEST.md with the manifest lines. */
export function buildKitZip({ tree, manifest }: KitZipInput): Uint8Array<ArrayBuffer> {
  const files: Zippable = {};
  for (const p of treePaths(tree)) {
    // Folders are empty directory entries; files get content (only MANIFEST.md has any until the endpoint lands).
    // fflate writes an empty object as a directory and adds the trailing slash itself.
    if (p.endsWith('/')) files[p.slice(0, -1)] = {};
    else files[p] = strToU8(p.endsWith('MANIFEST.md') ? `${manifest.join('\n')}\n` : '');
  }
  // Copied into a plain ArrayBuffer-backed array so it is a valid BlobPart.
  return new Uint8Array(zipSync(files));
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
