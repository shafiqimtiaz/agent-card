#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { generateTrainerCard } from './html.js';
import { scanClis, scanMcp, scanModels, scanBurn, scanSkills } from './scanner/index.js';
import { score, rarityLabel } from './scoring.js';
import { mockClis, mockMcp, mockModels, mockBurn, mockSkills } from './demo.js';
import { APP_TITLE, VERSION } from './constants.js';
import { Dashboard } from './cli.js';
import type { BurnMetrics, CliStatus, McpTool, ModelUsage, ScoreResult, SkillInfo } from './types.js';

interface Opts {
  demo?: boolean;
  share?: boolean;
  json?: boolean;
}

type ScanData = [CliStatus[], McpTool[], ModelUsage[], BurnMetrics, SkillInfo[]];

const program = new Command();

program
  .name('pokegent')
  .description('Terminal dashboard that shows your Pokémon AI coding ecosystem')
  .version(VERSION);

program
  .option('--demo', 'Run with mock data')
  .option('--share', 'Generate HTML Trainer Card on ~/Desktop')
  .option('--json', 'Export raw data as JSON')
  .action(async (opts: Opts) => {
    if (opts.share || opts.json) {
      await runOneShot(opts);
    } else if (!process.stdin.isTTY) {
      // stdin is piped/redirected (CI, `pokegent | tee`, etc.) — Ink cannot
      // enable raw mode, so print a static summary instead of crashing.
      await printStatic(opts);
    } else {
      const { waitUntilExit } = render(React.createElement(Dashboard, { demo: opts.demo ?? false }));
      await waitUntilExit();
    }
  });

async function gather(opts: Opts): Promise<ScanData> {
  if (opts.demo) {
    return [mockClis(), mockMcp(), mockModels(), mockBurn(), mockSkills()];
  }
  return Promise.all([scanClis(), scanMcp(), scanModels(), scanBurn(), scanSkills()]);
}

async function runOneShot(opts: Opts) {
  const [clis, mcp, models, burn, skills] = await gather(opts);
  const scoreResult = score(clis, mcp, models, burn, skills);

  if (opts.json) {
    console.log(JSON.stringify({ clis, mcp, models, burn, skills, score: scoreResult }, null, 2));
    return;
  }

  const html = generateTrainerCard(clis, mcp, models, burn, scoreResult, skills);
  const desktop = path.join(os.homedir(), 'Desktop');
  const outDir = fs.existsSync(desktop) ? desktop : os.homedir();
  const outPath = path.join(outDir, 'pokegent-card.html');
  fs.writeFileSync(outPath, html);
  console.log(`◓ Trainer Card saved → ${outPath}`);
  console.log('  Open it in a browser to view & share.');
}

async function printStatic(opts: Opts) {
  const [clis, mcp, models, burn, skills] = await gather(opts);
  const s: ScoreResult = score(clis, mcp, models, burn, skills);

  const detected = clis.filter(c => c.state === 'RUNNING' || c.state === 'IDLE');
  const running = detected.filter(c => c.state === 'RUNNING');
  const resting = detected.filter(c => c.state === 'IDLE');
  const totalTools = mcp.reduce((sum, t) => sum + t.toolCount, 0);
  const topModels = [...models].sort((a, b) => b.percentage - a.percentage).slice(0, 5);

  console.log(`${APP_TITLE} v${VERSION} — ${s.total} pts · ${rarityLabel(s.total)}`);
  console.log('');
  console.log(`Team: ${running.length} active / ${detected.length} caught`);
  for (const c of running) {
    console.log(`  ${c.icon} ${c.pokemonName ?? c.name} (${c.name}) — ● ${c.cpuPct.toFixed(1)}% CPU`);
  }
  if (resting.length > 0) {
    console.log(`  resting: ${resting.map(c => `${c.icon} ${c.pokemonName ?? c.name}`).join(', ')}`);
  }
  console.log('');
  const topTools = [...mcp].sort((a, b) => b.toolCount - a.toolCount).filter(t => t.toolCount > 0).slice(0, 5);
  console.log(`TMs & HMs: ${mcp.length} servers` + (totalTools > 0 ? ` · ${totalTools} tools` : '') +
    (topTools.length > 0 ? ` (${topTools.map(t => `${t.name} ×${t.toolCount}`).join(', ')})` : ''));
  console.log(`Movepool: ${topModels.map(m => `${m.name} ${m.percentage.toFixed(1)}%`).join(', ') || '—'}`);
  console.log(`Skills: ${skills.length} installed`);
  if (burn) {
    const tokens = burn.totalTokens >= 1_000_000 ? `${(burn.totalTokens / 1_000_000).toFixed(1)}M` : `${(burn.totalTokens / 1_000).toFixed(1)}K`;
    console.log(`PP Burn: ${tokens} tokens · $${burn.estimatedCostUsd.toFixed(2)}/mo · ${burn.tokenVelocity}/min · ${burn.sessionCount} sessions`);
  }
  if (s.badges.length > 0) {
    console.log(`Badges: ${s.badges.join(', ')}`);
  }
  console.log('');
  console.log('Tip: run pokegent in a terminal for the live TUI.');
}

program.parse();
