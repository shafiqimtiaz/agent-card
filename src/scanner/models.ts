import fs from 'fs/promises';
import { walkFiles, runPool } from './walk.js';
import { MODEL_PATTERNS, SCAN_DIRS, LOG_EXTENSIONS, SHELL_HISTORIES, expandHome } from '../constants.js';
import type { ModelUsage } from '../types.js';

// Cap per-file reads: huge files (Copilot embeddings, browser caches, logs)
// are reference data, not usage evidence — reading them costs seconds per scan.
const MAX_FILE_BYTES = 2 * 1024 * 1024;

// Compile once at module load, not per file per pattern (25 × 8000 compiles).
// The combined regex finds every position where ANY model name occurs; each
// match is then classified with anchored per-model tests, so a file is
// scanned once instead of 25 times.
const COMBINED_RE = new RegExp(Object.values(MODEL_PATTERNS).map(p => p.source).join('|'), 'gi');
// '^' + source: “does this pattern match starting exactly here?” — equivalent
// to counting whole-string occurrences, with zero false positives.
const ANCHORED_RES = Object.entries(MODEL_PATTERNS).map(
  ([name, p]) => [name, new RegExp(`^(?:${p.source})`, 'i')] as const,
);
// Match text is capped at 64 chars for classification — plenty for the
// longest pattern (~30 chars).
const CLASSIFY_WINDOW = 64;

export async function scanModels(): Promise<ModelUsage[]> {
  const hits: Record<string, number> = {};

  // Collect candidate files first (skips caches/builds, caps file size), then
  // read + regex them concurrently so a scan is sub-second, not 8 seconds.
  const files: string[] = [];
  for (const dir of SCAN_DIRS.models) {
    try {
      files.push(...(await walkFiles(expandHome(dir), {
        maxDepth: 4,
        maxFileSizeBytes: MAX_FILE_BYTES,
        extensions: LOG_EXTENSIONS,
      })));
    } catch {
      // dir not found
    }
  }

  await runPool(files, 24, async file => {
    try {
      const content = await fs.readFile(file, 'utf-8');
      countMatches(content, hits);
    } catch {
      // skip unreadable files
    }
  });

  // Scan shell history
  for (const hist of SHELL_HISTORIES) {
    const expanded = expandHome(hist);
    try {
      const content = await fs.readFile(expanded, 'utf-8');
      countMatches(content, hits);
    } catch {
      // not found
    }
  }

  if (Object.keys(hits).length === 0) {
    return mockModels();
  }

  const total = Object.values(hits).reduce((a, b) => a + b, 0);
  const usages = Object.entries(hits)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 1000) / 10,
    }));

  return usages;
}

function countMatches(content: string, hits: Record<string, number>): void {
  COMBINED_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = COMBINED_RE.exec(content)) !== null) {
    const window = content.slice(m.index, m.index + CLASSIFY_WINDOW);
    for (const [model, re] of ANCHORED_RES) {
      re.lastIndex = 0;
      if (re.test(window)) {
        hits[model] = (hits[model] ?? 0) + 1;
      }
    }
  }
}

function mockModels(): ModelUsage[] {
  const mock: [string, number][] = [
    ['claude-4-sonnet', 847],
    ['claude-3.7-sonnet', 623],
    ['gpt-4.1', 412],
    ['claude-4-opus', 289],
    ['o4-mini', 198],
    ['gemini-2.5-pro', 156],
    ['o3-mini', 134],
    ['deepseek-r1', 67],
    ['qwen-3', 45],
    ['llama-4', 23],
  ];
  const total = mock.reduce((a, [, c]) => a + c, 0);
  return mock.map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / total) * 1000) / 10,
  }));
}
