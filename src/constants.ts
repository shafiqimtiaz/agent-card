import path from 'path';
import os from 'os';
import pkg from '../package.json';

const home = os.homedir();

export const APP_TITLE = '◓ Pokégent';
export const VERSION = pkg.version;
export const REFRESH_INTERVAL = 2000;
// models/burn scans read thousands of files; refresh them far less often than
// the cheap process/config scans so the TUI stays responsive
const MINUTE_MS = 60_000;
export const EXPENSIVE_REFRESH_MS = MINUTE_MS;

export interface CliSignature {
  process: string[];
  config: string[];
  icon: string;
  pokemonId: number;
  pokemonSlug: string;
  pokemonName: string;
}

export const CLI_SIGNATURES: Record<string, CliSignature> = {
  'claude-code':   { process: ['claude', 'claude-code'],            config: ['~/.claude', '~/.claude.json', '~/.config/claude'],             icon: '🔮', pokemonId: 150, pokemonSlug: 'mewtwo',      pokemonName: 'Mewtwo' },
  'codex':         { process: ['codex', 'openai-codex'],            config: ['~/.codex', '~/.config/codex'],                                icon: '🍃', pokemonId: 3,   pokemonSlug: 'venusaur',    pokemonName: 'Venusaur' },
  'copilot':       { process: ['copilot', 'github-copilot'],        config: ['~/.copilot', '~/.config/github-copilot'],                     icon: '🐢', pokemonId: 9,   pokemonSlug: 'blastoise',   pokemonName: 'Blastoise' },
  'gemini-cli':    { process: ['gemini', 'gemini-cli'],             config: ['~/.gemini', '~/.config/gemini'],                              icon: '⚡️', pokemonId: 25,  pokemonSlug: 'pikachu',     pokemonName: 'Pikachu' },
  'cursor':        { process: ['cursor'],                           config: ['~/.cursor', '~/.cursor-server'],                              icon: '🦊', pokemonId: 133, pokemonSlug: 'eevee',       pokemonName: 'Eevee' },
  'amp':           { process: ['amp', 'amp-cli'],                   config: ['~/.amp', '~/.config/amp'],                                    icon: '🔥', pokemonId: 6,   pokemonSlug: 'charizard',   pokemonName: 'Charizard' },
  'cline':         { process: ['cline'],                            config: ['~/.cline', '~/.vscode/extensions/saoudrizwan.claude-dev-*'],  icon: '🦎', pokemonId: 4,   pokemonSlug: 'charmander',  pokemonName: 'Charmander' },
  'roo-code':      { process: ['roo', 'roo-code'],                  config: ['~/.roo', '~/.roo-code'],                                      icon: '👻', pokemonId: 94,  pokemonSlug: 'gengar',      pokemonName: 'Gengar' },
  'kilo-code':     { process: ['kilo', 'kilo-code'],                config: ['~/.kilo', '~/.kilo-code'],                                    icon: '🐻', pokemonId: 143, pokemonSlug: 'snorlax',     pokemonName: 'Snorlax' },
  'kiro':          { process: ['kiro'],                             config: ['~/.kiro', '~/.config/kiro'],                                  icon: '🦇', pokemonId: 41,  pokemonSlug: 'zubat',       pokemonName: 'Zubat' },
  'crush':         { process: ['crush'],                            config: ['~/.crush'],                                                   icon: '🎈', pokemonId: 39,  pokemonSlug: 'jigglypuff',  pokemonName: 'Jigglypuff' },
  'opencode':      { process: ['opencode'],                         config: ['~/.opencode', '~/.config/opencode'],                          icon: '🍮', pokemonId: 132, pokemonSlug: 'ditto',       pokemonName: 'Ditto' },
  'factory':       { process: ['factory', 'factory-droid'],         config: ['~/.factory-droid'],                                           icon: '💪', pokemonId: 68,  pokemonSlug: 'machamp',     pokemonName: 'Machamp' },
  'antigravity':   { process: ['antigravity', 'ag-cli'],            config: ['~/.antigravity'],                                             icon: '🐉', pokemonId: 384, pokemonSlug: 'rayquaza',    pokemonName: 'Rayquaza' },
  'kimi':          { process: ['kimi', 'kimi-cli'],                 config: ['~/.kimi', '~/.config/kimi'],                                  icon: '⛵️', pokemonId: 131, pokemonSlug: 'lapras',      pokemonName: 'Lapras' },
  'qwen':          { process: ['qwen', 'qwen-code'],               config: ['~/.qwen', '~/.config/qwen'],                                  icon: '🐉', pokemonId: 149, pokemonSlug: 'dragonite',   pokemonName: 'Dragonite' },
};

export interface McpScanPath {
  path: string;
  source: string;
}

export const MCP_SCAN_PATHS: McpScanPath[] = [
  { path: '~/.claude.json',                  source: 'Claude' },
  { path: '~/.claude/mcpServers.json',       source: 'Claude' },
  { path: '~/.claude/config.json',           source: 'Claude' },
  { path: '~/.config/claude/settings.json',  source: 'Claude' },
  { path: '~/.cursor/mcp.json',              source: 'Cursor' },
  { path: '~/.opencode/config.json',         source: 'OpenCode' },
  { path: '~/.roo/mcp.json',                 source: 'Roo Code' },
  { path: '~/.kilo/mcp.json',                source: 'Kilo Code' },
];

export const SKILL_SCAN_DIRS = [
  { path: '~/.claude/skills',           source: 'Claude' },
  { path: '~/.agents/skills',           source: 'Agents' },
  { path: '~/.config/opencode/skills',  source: 'OpenCode' },
];

export const MODEL_PATTERNS: Record<string, RegExp> = {
  'claude-fable-5':    /fable[\-\s]?5/i,
  'claude-sonnet-5':   /sonnet[\-\s]?5\b/i,
  'claude-opus-4.8':   /opus[\-\s]?4[.\-]?8/i,
  'claude-opus-4.5':   /opus[\-\s]?4[.\-]?5/i,
  'claude-opus-4.1':   /opus[\-\s]?4[.\-]?1\b/i,
  'claude-sonnet-4.5': /sonnet[\-\s]?4[.\-]?5/i,
  'claude-haiku-4.5':  /haiku[\-\s]?4[.\-]?5/i,
  'claude-4-opus':     /claude[\-\s]?4[\-\s]?opus|opus[\-\s]?4\b/i,
  'claude-4-sonnet':   /claude[\-\s]?4[\-\s]?sonnet|sonnet[\-\s]?4\b/i,
  'claude-3.7-sonnet': /claude[\-\s]?3[.\-]?7[\-\s]?sonnet/i,
  'claude-3.5-sonnet': /claude[\-\s]?3[.\-]?5[\-\s]?sonnet/i,
  'claude-3-haiku':    /claude[\-\s]?3[\-\s]?haiku/i,
  'gpt-5':             /gpt[\-\s]?5/i,
  'gpt-4.1':           /gpt[\-\s]?4\.?1/i,
  'gpt-4o':            /gpt[\-\s]?4o/i,
  'o4-mini':           /o4[\-\s]?mini/i,
  'o3':                /\bo3\b/i,
  'o3-mini':           /o3[\-\s]?mini/i,
  'gemini-3':          /gemini[\-\s]?3/i,
  'gemini-2.5-pro':    /gemini[\-\s]?2[.\-]?5[\-\s]?pro/i,
  'gemini-2.5-flash':  /gemini[\-\s]?2[.\-]?5[\-\s]?flash/i,
  'deepseek-v3':       /deepseek[\-\s]?v3/i,
  'deepseek-r1':       /deepseek[\-\s]?r1/i,
  'qwen-3':            /qwen[\-\s]?3/i,
  'llama-4':           /llama[\-\s]?4/i,
};

export const SCAN_DIRS = {
  models: ['~/.claude', '~/.cursor', '~/.config', '~/.local/share'],
  burn: ['~/.claude', '~/.cursor', '~/.opencode'],
};

export const LOG_EXTENSIONS = new Set(['.log', '.jsonl', '.json', '.txt']);

export const SHELL_HISTORIES = ['~/.bash_history', '~/.zsh_history', '~/.local/share/fish/fish_history'];

export const ENV_CHECKS = ['python3', 'node', 'git', 'pip3'];

export const SCORING = {
  MAX_AGENTS: 4,
  MAX_MCP_SERVERS: 15,
  MAX_MODELS: 5,
  AGENT_PTS: 75,
  AGENT_BONUS: 50,
  AGENT_BONUS_THRESHOLD: 3,
  MCP_SERVER_PTS: 10,
  MCP_TOOL_CAP: 50,
  MODEL_PTS: 30,
  PROVIDER_BONUS: 50,
  PROVIDER_THRESHOLD: 3,
  SKILL_PTS: 5,
  MAX_SKILLS: 20,
};

export function expandHome(p: string): string {
  return p.replace(/^~/, home);
}
