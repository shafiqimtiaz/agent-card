import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { CLI_SIGNATURES, expandHome } from '../constants.js';
import type { CliStatus } from '../types.js';

export async function scanClis(): Promise<CliStatus[]> {
  const results: CliStatus[] = [];

  for (const [name, sig] of Object.entries(CLI_SIGNATURES)) {
    const procResult = await probeProcess(sig.process);

    let state: CliStatus['state'] = procResult.state;
    let pid = procResult.pid;
    let cpuPct = procResult.cpuPct;
    let memMb = procResult.memMb;
    let uptimeS = procResult.uptimeS;

    if (state === 'ABSENT') {
      for (const cp of sig.config) {
        const expanded = expandHome(cp);
        if (expanded.includes('*')) {
          const matches = await glob(expanded);
          if (matches.length > 0) {
            state = 'DETECTED';
            break;
          }
        } else {
          try {
            await fs.access(expanded);
            state = 'IDLE';
            break;
          } catch {
            // not found
          }
        }
      }
    }

    results.push({ name, icon: sig.icon, state, pid, cpuPct, memMb, uptimeS, pokemonId: sig.pokemonId, pokemonSlug: sig.pokemonSlug, pokemonName: sig.pokemonName });
  }

  return results;
}

async function probeProcess(keywords: string[]): Promise<{
  state: CliStatus['state'];
  pid: number | null;
  cpuPct: number;
  memMb: number;
  uptimeS: number;
}> {
  try {
    const psList = await import('ps-list');
    const processes = await psList.default();

    for (const proc of processes) {
      const combined = `${proc.name} ${proc.cmd}`.toLowerCase();
      for (const kw of keywords) {
        if (combined.includes(kw.toLowerCase())) {
          return {
            state: 'RUNNING',
            pid: proc.pid,
            cpuPct: proc.cpu ?? 0,
            memMb: (proc.memory ?? 0) / 1024 / 1024,
            uptimeS: 0,
          };
        }
      }
    }
  } catch {
    // ps-list not available
  }

  return { state: 'ABSENT', pid: null, cpuPct: 0, memMb: 0, uptimeS: 0 };
}
