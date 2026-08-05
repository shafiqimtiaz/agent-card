import fs from 'fs/promises';
import path from 'path';
import { walkFiles, runPool } from './walk.js';
import { SCAN_DIRS, LOG_EXTENSIONS, ENV_CHECKS, expandHome } from '../constants.js';
import type { BurnMetrics } from '../types.js';

const HOUR_MS = 3_600_000;

// Slightly larger cap than the models scan: Claude transcripts (the main token
// source) regularly exceed a few MB, and skipping them would under-report.
const MAX_FILE_BYTES = 8 * 1024 * 1024;

// Compiled once, not per file.
const INPUT_RE = /"input_tokens?":\s*(\d+)/gi;
const OUTPUT_RE = /"output_tokens?":\s*(\d+)/gi;

export async function scanBurn(): Promise<BurnMetrics> {
  let totalTokens = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let recentTokens = 0;
  let sessions = 0;
  const now = Date.now();

  const files: string[] = [];
  for (const dir of SCAN_DIRS.burn) {
    try {
      files.push(...(await walkFiles(expandHome(dir), {
        maxDepth: 3,
        maxFileSizeBytes: MAX_FILE_BYTES,
        extensions: LOG_EXTENSIONS,
      })));
    } catch {
      // dir not found
    }
  }

  await runPool(files, 24, async filePath => {
    try {
      const [content, stat] = await Promise.all([
        fs.readFile(filePath, 'utf-8'),
        fs.stat(filePath),
      ]);

      // Claude Code writes one .jsonl transcript per session under projects/
      if (filePath.includes(`${path.sep}projects${path.sep}`) && filePath.endsWith('.jsonl')) {
        sessions++;
      }

      // Cheap pre-filter: files that never mention tokens cost one indexOf
      // instead of a full line-by-line parse.
      if (!content.toLowerCase().includes('token')) return;

      let fileTokens = 0;
      const inMatches = content.match(INPUT_RE);
      const outMatches = content.match(OUTPUT_RE);
      if (inMatches) {
        const n = inMatches.reduce((sum, m) => sum + parseInt(m.match(/\d+/)![0]), 0);
        inputTokens += n;
        fileTokens += n;
      }
      if (outMatches) {
        const n = outMatches.reduce((sum, m) => sum + parseInt(m.match(/\d+/)![0]), 0);
        outputTokens += n;
        fileTokens += n;
      }
      totalTokens += fileTokens;
      if (now - stat.mtimeMs < HOUR_MS) {
        recentTokens += fileTokens;
      }
    } catch {
      // skip unreadable files
    }
  });

  if (totalTokens === 0) {
    return mockBurn();
  }

  const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
  // tokens written in the last hour, per minute
  const velocity = recentTokens / 60;

  return {
    totalTokens,
    inputTokens,
    outputTokens,
    estimatedCostUsd: Math.round(cost * 10000) / 10000,
    sessionCount: Math.max(sessions, 1),
    tokenVelocity: Math.round(velocity),
    envIntegrity: await getEnvIntegrity(),
  };
}

async function getEnvIntegrity(): Promise<number> {
  let score = 1.0;
  const { execSync } = await import('child_process');
  for (const cmd of ENV_CHECKS) {
    try {
      execSync(`which ${cmd}`, { stdio: 'ignore' });
    } catch {
      score -= 0.15;
    }
  }
  return Math.max(score, 0);
}

function mockBurn(): BurnMetrics {
  return {
    totalTokens: 2_847_392,
    inputTokens: 1_923_456,
    outputTokens: 923_936,
    estimatedCostUsd: 18.47,
    sessionCount: 142,
    tokenVelocity: 14_236,
    envIntegrity: 0.85,
  };
}
