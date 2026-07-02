#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { generateTrainerCard } from './html.js';
import { scanClis, scanMcp, scanModels, scanBurn, scanSkills } from './scanner/index.js';
import { score } from './scoring.js';
import { mockClis, mockMcp, mockModels, mockBurn, mockSkills } from './demo.js';
import { VERSION } from './constants.js';
import { Dashboard } from './cli.js';

interface Opts {
  demo?: boolean;
  share?: boolean;
  json?: boolean;
}

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
    } else {
      const { waitUntilExit } = render(React.createElement(Dashboard, { demo: opts.demo ?? false }));
      await waitUntilExit();
    }
  });

async function runOneShot(opts: Opts) {
  let clis, mcp, models, burn, skills;

  if (opts.demo) {
    clis = mockClis();
    mcp = mockMcp();
    models = mockModels();
    burn = mockBurn();
    skills = mockSkills();
  } else {
    [clis, mcp, models, burn, skills] = await Promise.all([
      scanClis(),
      scanMcp(),
      scanModels(),
      scanBurn(),
      scanSkills(),
    ]);
  }

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

program.parse();
