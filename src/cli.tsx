import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { scanClis, scanMcp, scanModels, scanBurn } from './scanner/index.js';
import { score } from './scoring.js';
import { mockClis, mockMcp, mockModels, mockBurn } from './demo.js';
import { APP_TITLE, REFRESH_INTERVAL, VERSION } from './constants.js';
import type { CliStatus, McpTool, ModelUsage, BurnMetrics, ScoreResult } from './types.js';
 
interface DashboardProps {
  demo: boolean;
}
 
export function Dashboard({ demo }: DashboardProps) {
  const { exit } = useApp();
  const [clis, setClis] = useState<CliStatus[]>([]);
  const [mcp, setMcp] = useState<McpTool[]>([]);
  const [models, setModels] = useState<ModelUsage[]>([]);
  const [burn, setBurn] = useState<BurnMetrics | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [scanTime, setScanTime] = useState(0);
  const [lastMessage, setLastMessage] = useState('');
  const scanningRef = useRef(false);
 
  const runScan = useCallback(async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    const t0 = Date.now();
    try {
      let c: CliStatus[], m: McpTool[], mo: ModelUsage[], b: BurnMetrics;
      if (demo) {
        c = mockClis();
        m = mockMcp();
        mo = mockModels();
        b = mockBurn();
      } else {
        [c, m, mo, b] = await Promise.all([
          scanClis(),
          scanMcp(),
          scanModels(),
          scanBurn(),
        ]);
      }
      const s = score(c, m, mo, b);
      setClis(c);
      setMcp(m);
      setModels(mo);
      setBurn(b);
      setScoreResult(s);
      setScanTime((Date.now() - t0) / 1000);
    } catch (err) {
      setLastMessage(`Scan error: ${err}`);
    } finally {
      scanningRef.current = false;
    }
  }, [demo]);
 
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    async function tick() {
      await runScan();
      timeoutId = setTimeout(tick, REFRESH_INTERVAL);
    }
    
    tick();
    
    return () => clearTimeout(timeoutId);
  }, [runScan]);
 
  useInput((input, key) => {
    if (input === 'q') exit();
    if (input === 'r') runScan();
  });
 
  if (clis.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text bold color="cyan">
            {APP_TITLE} <Text color="gray">v{VERSION}</Text>
          </Text>
        </Box>
        <Box marginTop={2} marginBottom={2} flexDirection="column" gap={1}>
          <Text bold color="yellow">
            ◓ Scanning Pokémon coding ecosystem...
          </Text>
          <Text color="gray">
            (First live scan takes a few seconds to recursively search local logs & history)
          </Text>
        </Box>
        <Box marginTop={1} justifyContent="space-between">
          <Text color="gray">
            <Text color="green">● LIVE</Text> │ Scan: {scanTime.toFixed(1)}s │ {new Date().toLocaleTimeString()}
          </Text>
          <Text color="gray">q quit</Text>
        </Box>
      </Box>
    );
  }
 
  const clisDetected = clis.filter(c => c.state !== 'ABSENT');
  const running = clisDetected.filter(c => c.state === 'RUNNING');
  const totalTools = mcp.reduce((sum, t) => sum + t.toolCount, 0);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold color="cyan">
          {APP_TITLE} <Text color="gray">v{VERSION}</Text>
        </Text>
        {scoreResult && (
          <Text bold color="green">
            {scoreResult.total} pts
          </Text>
        )}
      </Box>

      {/* Grid */}
      <Box flexDirection="row" gap={2}>
        {/* Left column */}
        <Box flexDirection="column" width="50%">
          {/* Agents */}
          <Box flexDirection="column" marginBottom={1}>
            <Text bold color="blue">
              🎒 POKÉMON TEAM ({running.length} running)
            </Text>
            {clisDetected.slice(0, 8).map((c, i) => (
              <Box key={i}>
                <Text>
                  {c.icon} {c.name.padEnd(20)}{' '}
                  {c.state === 'RUNNING' ? (
                    <Text color="green">● {c.cpuPct.toFixed(1)}% CPU</Text>
                  ) : c.state === 'IDLE' ? (
                    <Text color="yellow">○ idle</Text>
                  ) : c.state === 'DETECTED' ? (
                    <Text color="gray">○ detected</Text>
                  ) : (
                    <Text color="gray">○ absent</Text>
                  )}
                </Text>
              </Box>
            ))}
            {clisDetected.length > 8 && <Text color="gray">   … +{clisDetected.length - 8} more</Text>}
          </Box>

          {/* MCP */}
          <Box flexDirection="column">
            <Text bold color="yellow">
              🎒 TMs & HMs · MCP Servers ({mcp.length} servers, {totalTools} tools)
            </Text>
            {[...mcp].sort((a, b) => b.toolCount - a.toolCount).slice(0, 6).map((t, i) => (
              <Box key={i}>
                <Text>
                  ◆ {t.name.padEnd(20)} {t.toolCount ? `[${t.toolCount}]` : ''}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right column */}
        <Box flexDirection="column" width="50%">
          {/* Models */}
          <Box flexDirection="column" marginBottom={1}>
            <Text bold color="magenta">
              📊 MOVEPOOL · Model Usage
            </Text>
            {models.slice(0, 6).map((m, i) => {
              const filled = Math.floor(m.percentage / 100 * 10);
              const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
              return (
                <Box key={i}>
                  <Text>
                    {m.name.padEnd(18)} {bar} {m.percentage.toFixed(1).padStart(5)}%
                  </Text>
                </Box>
              );
            })}
          </Box>

          {/* Burn */}
          {burn && (
            <Box flexDirection="column">
              <Text bold color="red">
                🔋 PP BURN · Token Usage
              </Text>
              <Text>  Tokens (PP)   {burn.totalTokens >= 1_000_000 ? `${(burn.totalTokens / 1_000_000).toFixed(1)}M` : `${(burn.totalTokens / 1_000).toFixed(1)}K`}</Text>
              <Text>  Cost ($)      ${burn.estimatedCostUsd.toFixed(2)}/mo</Text>
              <Text>  Token Rate    {burn.tokenVelocity >= 1_000 ? `${(burn.tokenVelocity / 1_000).toFixed(1)}K` : burn.tokenVelocity}/min</Text>
              <Text>  Sessions      {burn.sessionCount}</Text>
              <Text>  Env Health    {burn.envIntegrity >= 0.8 ? '🟢' : burn.envIntegrity >= 0.5 ? '🟡' : '🔴'} {Math.round(burn.envIntegrity * 100)}%</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Badges */}
      {scoreResult && scoreResult.badges.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="yellow">🏅 BADGES</Text>
          <Box flexWrap="wrap" gap={1}>
            {scoreResult.badges.map((b, i) => (
              <Text key={i} color="yellow">{b}</Text>
            ))}
          </Box>
        </Box>
      )}

      {/* Status bar */}
      <Box marginTop={1} justifyContent="space-between">
        <Text color="gray">
          <Text color="green">● {demo ? 'DEMO' : 'LIVE'}</Text> │ Scan: {scanTime.toFixed(1)}s │ {new Date().toLocaleTimeString()}
        </Text>
        <Text color="gray">q quit │ r refresh</Text>
      </Box>

      {/* Message */}
      {lastMessage && (
        <Box marginTop={1}>
          <Text bold color="green">{lastMessage}</Text>
        </Box>
      )}
    </Box>
  );
}
