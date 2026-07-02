import type { CliStatus, McpTool, ModelUsage, BurnMetrics } from './types.js';
import { CLI_SIGNATURES } from './constants.js';

export function mockClis(): CliStatus[] {
  const states: Array<[CliStatus['state'], number | null, number, number, number]> = [
    ['RUNNING', 42069, 12.3, 256, 3600],
    ['RUNNING', 42070, 8.1, 128.5, 1800],
    ['IDLE', null, 0, 0, 0],
    ['RUNNING', 42071, 5.2, 64, 900],
    ['DETECTED', null, 0, 0, 0],
    ['IDLE', null, 0, 0, 0],
    ['RUNNING', 42072, 15.7, 512, 7200],
    ['DETECTED', null, 0, 0, 0],
    ['IDLE', null, 0, 0, 0],
    ['ABSENT', null, 0, 0, 0],
    ['DETECTED', null, 0, 0, 0],
    ['IDLE', null, 0, 0, 0],
    ['ABSENT', null, 0, 0, 0],
    ['DETECTED', null, 0, 0, 0],
    ['RUNNING', 42073, 3.4, 96, 600],
    ['IDLE', null, 0, 0, 0],
  ];

  return Object.entries(CLI_SIGNATURES).map(([name, sig], i) => {
    const [state, pid, cpuPct, memMb, uptimeS] = states[i % states.length];
    return { name, icon: sig.icon, state, pid, cpuPct, memMb, uptimeS, pokemonId: sig.pokemonId, pokemonSlug: sig.pokemonSlug, pokemonName: sig.pokemonName };
  });
}

export function mockMcp(): McpTool[] {
  return [
    { name: 'filesystem', source: 'Claude', toolCount: 14, description: 'File system operations' },
    { name: 'github', source: 'Claude', toolCount: 8, description: 'GitHub API integration' },
    { name: 'postgres', source: 'Claude', toolCount: 6, description: 'PostgreSQL queries' },
    { name: 'brave-search', source: 'Claude', toolCount: 2, description: 'Web search' },
    { name: 'memory', source: 'Claude', toolCount: 3, description: 'Persistent memory store' },
    { name: 'puppeteer', source: 'n8n', toolCount: 5, description: 'Browser automation' },
    { name: 'slack', source: 'n8n', toolCount: 4, description: 'Slack messaging' },
    { name: 'notion', source: 'n8n', toolCount: 7, description: 'Notion workspace' },
    { name: 'jira', source: 'n8n', toolCount: 6, description: 'Jira issue tracking' },
    { name: 'confluence', source: 'n8n', toolCount: 4, description: 'Confluence pages' },
    { name: 'bitbucket', source: 'n8n', toolCount: 6, description: 'Bitbucket repos/PRs' },
    { name: 'tempo', source: 'n8n', toolCount: 3, description: 'Time tracking' },
    { name: 'cursor-mcp', source: 'Cursor', toolCount: 4, description: 'Cursor integrations' },
    { name: 'playwright', source: 'Claude', toolCount: 8, description: 'E2E browser testing' },
    { name: 'context7', source: 'Claude', toolCount: 2, description: 'Documentation lookup' },
    { name: 'supabase', source: 'Claude', toolCount: 20, description: 'Database & auth' },
  ];
}

export function mockModels(): ModelUsage[] {
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

export function mockBurn(): BurnMetrics {
  return {
    totalTokens: 2_847_392,
    inputTokens: 1_923_456,
    outputTokens: 923_936,
    estimatedCostUsd: 18.47,
    sessionCount: 142,
    avgTokensPerSession: 20_052,
    burnRatePerMin: 0.0385,
    tokenVelocity: 14_236,
    envIntegrity: 0.85,
  };
}
