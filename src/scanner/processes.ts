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

// GUI/helper processes that must never count as a running CLI agent
const PROC_DENYLIST = ['claude-desktop', 'crashpad', 'chrome_crashpad', '--type='];

function cmdBinary(cmd: string | undefined): string {
  if (!cmd) return '';
  const first = cmd.trim().split(/\s+/)[0] ?? '';
  const base = first.split('/').pop() ?? '';
  // "node /path/to/claude" style launchers: use second arg's basename
  if (['node', 'python', 'python3', 'sh', 'bash'].includes(base)) {
    const second = cmd.trim().split(/\s+/)[1] ?? '';
    return (second.split('/').pop() ?? '').toLowerCase();
  }
  return base.toLowerCase();
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

    let pid: number | null = null;
    let cpuPct = 0;
    let memMb = 0;
    let found = false;

    for (const proc of processes) {
      const cmd = `${proc.cmd ?? ''}`.toLowerCase();
      if (PROC_DENYLIST.some(d => cmd.includes(d))) continue;

      const name = proc.name.toLowerCase();
      const binary = cmdBinary(proc.cmd);

      // exact binary-name match only — substring matching produced false
      // positives (e.g. "claude" matching claude-desktop, "roo" matching
      // unrelated cmdline text)
      const hit = keywords.some(kw => {
        const k = kw.toLowerCase();
        return name === k || binary === k;
      });
      if (hit) {
        found = true;
        if (pid === null) pid = proc.pid;
        cpuPct += proc.cpu ?? 0;
        memMb += (proc.memory ?? 0) / 1024 / 1024;
      }
    }

    if (found) {
      return { state: 'RUNNING', pid, cpuPct, memMb, uptimeS: 0 };
    }
  } catch {
    // ps-list not available
  }

  return { state: 'ABSENT', pid: null, cpuPct: 0, memMb: 0, uptimeS: 0 };
}
