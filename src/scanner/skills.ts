import fs from 'fs/promises';
import { SKILL_SCAN_DIRS, expandHome } from '../constants.js';
import type { SkillInfo } from '../types.js';

export async function scanSkills(): Promise<SkillInfo[]> {
  const seen = new Map<string, SkillInfo>();

  for (const { path: dir, source } of SKILL_SCAN_DIRS) {
    const expanded = expandHome(dir);
    try {
      const entries = await fs.readdir(expanded, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
        if (entry.name.startsWith('.')) continue;
        if (!seen.has(entry.name)) {
          seen.set(entry.name, { name: entry.name, source });
        }
      }
    } catch {
      // dir not found
    }
  }

  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}
