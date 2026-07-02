#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { Command } from 'commander';
import { scanClis, scanMcp, scanModels, scanBurn } from './scanner/index.js';
import { score } from './scoring.js';
import { mockClis, mockMcp, mockModels, mockBurn } from './demo.js';
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
  let clis, mcp, models, burn;

  if (opts.demo) {
    clis = mockClis();
    mcp = mockMcp();
    models = mockModels();
    burn = mockBurn();
  } else {
    [clis, mcp, models, burn] = await Promise.all([
      scanClis(),
      scanMcp(),
      scanModels(),
      scanBurn(),
    ]);
  }

  const scoreResult = score(clis, mcp, models, burn);

  if (opts.json) {
    console.log(JSON.stringify({ clis, mcp, models, burn, score: scoreResult }, null, 2));
    return;
  }

  console.log('--share requires HTML card module (not included in minimal build)');
  console.log(JSON.stringify({ clis, mcp, models, burn, score: scoreResult }, null, 2));
}

program.parse();
