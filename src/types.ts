export interface CliStatus {
  name: string;
  icon: string;
  state: 'RUNNING' | 'IDLE' | 'DETECTED' | 'ABSENT';
  pid: number | null;
  cpuPct: number;
  memMb: number;
  uptimeS: number;
  pokemonId?: number;
  pokemonSlug?: string;
  pokemonName?: string;
}

export interface McpTool {
  name: string;
  source: string;
  toolCount: number;
  description: string;
}

export interface ModelUsage {
  name: string;
  count: number;
  percentage: number;
}

export interface BurnMetrics {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  sessionCount: number;
  avgTokensPerSession: number;
  burnRatePerMin: number;
  tokenVelocity: number;
  envIntegrity: number;
}

export interface ScoreResult {
  total: number;
  agentsScore: number;
  mcpScore: number;
  modelsScore: number;
  burnScore: number;
  badges: string[];
}
