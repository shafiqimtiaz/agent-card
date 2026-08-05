import fs from 'fs/promises';
import path from 'path';
import type { Dirent } from 'node:fs';

// Directories that never contain model/token usage worth scanning. These
// dominate byte counts in ~/.config and ~/.local/share (node_modules,
// caches, build artifacts) and were the reason full scans took seconds.
export const DEFAULT_SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  '.cache',
  'cacheddata',
  'GPUCache',
  'Code Cache',
  '.venv',
  'venv',
  '__pycache__',
  '.next',
  '.terraform',
  'dist',
  'build',
  'coverage',
  'target',
  'Trash',
]);

export interface WalkOptions {
  /** Max directory nesting below root (default 4, same as previous scans) */
  maxDepth?: number;
  /** Files larger than this many bytes are skipped (0 = unlimited, default 2MB) */
  maxFileSizeBytes?: number;
  /** Only include files with these extensions (lowercase, incl. dot); empty = all */
  extensions?: Set<string>;
  /** Extra directory names to skip, merged with DEFAULT_SKIP_DIRS */
  skipDirs?: Set<string>;
}

/**
 * Collect file paths under `root` that are worth reading: skips symlinks,
 * known-heavy directories, oversized files and (optionally) non-matching
 * extensions. Exists so scanners don't each reinvent a slow full-tree walk.
 */
export async function walkFiles(root: string, opts: WalkOptions = {}): Promise<string[]> {
  const { maxDepth = 4, maxFileSizeBytes = 2 * 1024 * 1024, extensions, skipDirs } = opts;
  const skip = new Set([...DEFAULT_SKIP_DIRS, ...(skipDirs ?? [])]);
  const out: string[] = [];

  async function walk(dir: string, depth: number): Promise<void> {
    let entries: Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return; // missing / unreadable
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue; // avoid loops & escapes
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (skip.has(entry.name) || depth <= 0) continue;
        await walk(full, depth - 1);
      } else if (entry.isFile()) {
        if (extensions && !extensions.has(path.extname(entry.name).toLowerCase())) continue;
        out.push(full);
      }
    }
  }

  await walk(root, maxDepth);

  if (maxFileSizeBytes > 0) {
    const keep: string[] = [];
    await runPool(out, 24, async file => {
      try {
        const st = await fs.stat(file);
        if (st.size <= maxFileSizeBytes) keep.push(file);
      } catch {
        // file vanished mid-walk
      }
    });
    return keep;
  }
  return out;
}

/** Run `fn` over `items` with a bounded number of concurrent workers. */
export async function runPool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      try {
        await fn(item);
      } catch {
        // errors are the caller's concern; keep the pool alive
      }
    }
  });
  await Promise.all(workers);
}
