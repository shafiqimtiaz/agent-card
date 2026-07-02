import { SCORING } from './constants.js';
import type { CliStatus, McpTool, ModelUsage, BurnMetrics, SkillInfo, ScoreResult } from './types.js';

export function score(
  clis: CliStatus[],
  mcp: McpTool[],
  models: ModelUsage[],
  burn: BurnMetrics,
  skills: SkillInfo[] = [],
): ScoreResult {
  const running = clis.filter(c => c.state === 'RUNNING').length;
  const agentsPts = Math.min(running, SCORING.MAX_AGENTS) * SCORING.AGENT_PTS
    + (running >= SCORING.AGENT_BONUS_THRESHOLD ? SCORING.AGENT_BONUS : 0);

  const totalTools = mcp.reduce((sum, t) => sum + t.toolCount, 0);
  const mcpPts = Math.min(mcp.length, SCORING.MAX_MCP_SERVERS) * SCORING.MCP_SERVER_PTS
    + Math.min(totalTools, SCORING.MCP_TOOL_CAP);

  const providerCount = getProviderCount(models);
  const modelPts = Math.min(models.length, SCORING.MAX_MODELS) * SCORING.MODEL_PTS
    + (providerCount >= SCORING.PROVIDER_THRESHOLD ? SCORING.PROVIDER_BONUS : 0);

  const vel = burn.tokenVelocity;
  const velPts = vel >= 20_000 ? 150 : vel >= 5_000 ? 100 : vel >= 1_000 ? 50 : 0;
  const sessionPts = Math.min(Math.floor(burn.sessionCount / 10), 10) * 10;
  const burnPts = velPts + sessionPts;

  const skillsPts = Math.min(skills.length, SCORING.MAX_SKILLS) * SCORING.SKILL_PTS;

  const total = Math.min(agentsPts + mcpPts + modelPts + skillsPts + burnPts, 1000);

  const badges = getBadges(clis, mcp, models, burn, skills);

  return {
    total,
    agentsScore: agentsPts,
    mcpScore: mcpPts,
    modelsScore: modelPts,
    skillsScore: skillsPts,
    burnScore: burnPts,
    badges,
  };
}

function getProviderCount(models: ModelUsage[]): number {
  const providers = new Set<string>();
  for (const m of models) {
    const name = m.name.toLowerCase();
    if (name.includes('claude')) providers.add('anthropic');
    else if (name.includes('gpt') || name.startsWith('o3') || name.startsWith('o4')) providers.add('openai');
    else if (name.includes('gemini')) providers.add('google');
    else if (name.includes('deepseek')) providers.add('deepseek');
    else if (name.includes('qwen')) providers.add('alibaba');
    else if (name.includes('llama')) providers.add('meta');
  }
  return providers.size;
}

function getBadges(
  clis: CliStatus[],
  mcp: McpTool[],
  models: ModelUsage[],
  burn: BurnMetrics,
  skills: SkillInfo[],
): string[] {
  const badges: string[] = [];
  const running = clis.filter(c => c.state === 'RUNNING').length;
  const providerCount = getProviderCount(models);

  if (mcp.length >= 10) badges.push('🏆 Pokédex Master');
  if (running >= 3) badges.push('🦄 Legendary Trainer');
  if (providerCount >= 3) badges.push('🧬 Hybrid Evolution');
  if (burn.tokenVelocity >= 10_000) badges.push('🔥 Blast Burn');
  if (burn.sessionCount >= 100) badges.push('💎 Elite Four');
  if (models.length >= 5) badges.push('🌐 Safari Zone Master');
  if (skills.length >= 20) badges.push('📚 Move Tutor');

  return badges;
}

export function rarityLabel(score: number): string {
  if (score >= 900) return '🌟 MYTHICAL CHAMPION — Top 1%';
  if (score >= 750) return '💎 SHINY LEGENDARY — Top 5%';
  if (score >= 600) return '🥇 POKÉMON MASTER — Top 15%';
  if (score >= 400) return '🥈 GYM LEADER — Top 35%';
  if (score >= 200) return '🥉 ELITE TRAINER — Top 60%';
  return '🌱 BEGINNER TRAINER — everyone starts here';
}
