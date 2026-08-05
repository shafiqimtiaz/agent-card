import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { scanClis, scanMcp, scanModels, scanBurn, scanSkills } from './scanner/index.js';
import { score, rarityLabel } from './scoring.js';
import { mockClis, mockMcp, mockModels, mockBurn, mockSkills } from './demo.js';
import { APP_TITLE, REFRESH_INTERVAL, EXPENSIVE_REFRESH_MS, VERSION } from './constants.js';
import type { CliStatus, McpTool, ModelUsage, BurnMetrics, SkillInfo, ScoreResult } from './types.js';

const BALL_FRAMES = ['◐', '◓', '◑', '◒'];
const MAX_WIDTH = 112;

function dashWidth(): number {
  return Math.min((process.stdout.columns ?? 100) - 2, MAX_WIDTH);
}

interface DashboardProps {
  demo: boolean;
}

function usePokeball(active: boolean): string {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setFrame(f => (f + 1) % BALL_FRAMES.length), 200);
    return () => clearInterval(id);
  }, [active]);
  return active ? BALL_FRAMES[frame] : '●';
}

function hpColor(pct: number): string {
  return pct > 50 ? 'green' : pct > 20 ? 'yellow' : 'red';
}

function Panel({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={color} paddingX={1} marginBottom={1}>
      <Text bold color={color}>{title}</Text>
      {children}
    </Box>
  );
}

export function Dashboard({ demo }: DashboardProps) {
  const { exit } = useApp();
  const [clis, setClis] = useState<CliStatus[]>([]);
  const [mcp, setMcp] = useState<McpTool[]>([]);
  const [models, setModels] = useState<ModelUsage[]>([]);
  const [burn, setBurn] = useState<BurnMetrics | null>(null);
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [scanTime, setScanTime] = useState(0);
  const [scanning, setScanning] = useState(true);
  const [lastMessage, setLastMessage] = useState('');
  const scanningRef = useRef(false);
  const lastExpensiveRef = useRef(0);
  // latest models/burn, kept in refs so cheap-only ticks can reuse them
  const modelsRef = useRef<ModelUsage[]>([]);
  const burnRef = useRef<BurnMetrics | null>(null);
  const ball = usePokeball(scanning);

  const runScan = useCallback(async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setScanning(true);
    const t0 = Date.now();
    try {
      let c: CliStatus[], m: McpTool[], mo: ModelUsage[], b: BurnMetrics, sk: SkillInfo[];
      if (demo) {
        c = mockClis();
        m = mockMcp();
        mo = mockModels();
        b = mockBurn();
        sk = mockSkills();
      } else {
        // Cheap scans (process table, configs, skills) run every tick.
        // The expensive file-tree scans (models, burn) only run every
        // EXPENSIVE_REFRESH_MS — otherwise the TUI grinds through
        // thousands of log files every 2 seconds.
        const now = Date.now();
        const expensiveDue = now - lastExpensiveRef.current >= EXPENSIVE_REFRESH_MS;
        [c, m, sk] = await Promise.all([scanClis(), scanMcp(), scanSkills()]);
        // Re-run expensive scans if they've never succeeded yet (first tick
        // or a previous failure) — score() needs a real BurnMetrics.
        const prevBurn = burnRef.current;
        if (expensiveDue || prevBurn === null) {
          lastExpensiveRef.current = now;
          [mo, b] = await Promise.all([scanModels(), scanBurn()]);
          modelsRef.current = mo;
          burnRef.current = b;
        } else {
          mo = modelsRef.current;
          b = prevBurn;
        }
      }
      const s = score(c, m, mo, b, sk);
      setClis(c);
      setMcp(m);
      setModels(mo);
      setBurn(b);
      setSkills(sk);
      setScoreResult(s);
      setScanTime((Date.now() - t0) / 1000);
    } catch (err) {
      setLastMessage(`Scan error: ${err}`);
    } finally {
      setScanning(false);
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
      <Box flexDirection="column" padding={1} width={dashWidth()}>
        <Box borderStyle="round" borderColor="red" paddingX={1} justifyContent="space-between">
          <Text bold color="redBright">
            {APP_TITLE} <Text color="gray">v{VERSION}</Text>
          </Text>
        </Box>
        <Box marginTop={1} marginBottom={1} flexDirection="column" gap={1} paddingX={1}>
          <Text bold color="yellow">
            {ball} Scanning Pokémon coding ecosystem...
          </Text>
          <Text color="gray">
            (Gathering process, config & log data…)
          </Text>
        </Box>
        <Box paddingX={1} justifyContent="space-between">
          <Text color="gray">
            <Text color="green">● LIVE</Text> │ {new Date().toLocaleTimeString()}
          </Text>
          <Text color="gray">q quit</Text>
        </Box>
      </Box>
    );
  }

  const clisDetected = clis.filter(c => c.state === 'RUNNING' || c.state === 'IDLE');
  const running = clisDetected.filter(c => c.state === 'RUNNING');
  const totalTools = mcp.reduce((sum, t) => sum + t.toolCount, 0);

  return (
    <Box flexDirection="column" padding={1} width={dashWidth()}>
      {/* Header — Pokédex band */}
      <Box borderStyle="round" borderColor="red" paddingX={1} justifyContent="space-between" marginBottom={1}>
        <Text bold color="redBright">
          {APP_TITLE} <Text color="gray">v{VERSION}</Text>
        </Text>
        {scoreResult && (
          <Text>
            <Text bold color="greenBright">{scoreResult.total} pts</Text>
            <Text color="gray"> │ </Text>
            <Text color="yellow">{rarityLabel(scoreResult.total)}</Text>
          </Text>
        )}
      </Box>

      {/* Grid */}
      <Box flexDirection="row">
        {/* Left column */}
        <Box flexDirection="column" width="50%" paddingRight={1}>
          <Panel title={`🎒 POKÉMON TEAM  ·  ${running.length} active / ${clisDetected.length} caught`} color="blue">
            {clisDetected.slice(0, 8).map((c, i) => (
              <Box key={i}>
                <Box width={3} flexShrink={0}><Text>{c.icon}</Text></Box>
                <Box width={13} flexShrink={0}><Text bold wrap="truncate">{c.pokemonName ?? c.name}</Text></Box>
                <Box flexGrow={1}><Text color="gray" wrap="truncate">{c.name}</Text></Box>
                <Box flexShrink={0} justifyContent="flex-end">
                  {c.state === 'RUNNING' ? (
                    <Text color="green">● {c.cpuPct.toFixed(1)}% CPU</Text>
                  ) : c.state === 'IDLE' ? (
                    <Text color="yellow">◌ resting</Text>
                  ) : (
                    <Text color="gray">◌ in box</Text>
                  )}
                </Box>
              </Box>
            ))}
            {clisDetected.length > 8 && <Text color="gray">  … +{clisDetected.length - 8} more</Text>}
          </Panel>

          <Panel title={`💿 TMs & HMs  ·  ${mcp.length} servers${totalTools > 0 ? ` / ${totalTools} tools` : ''}`} color="yellow">
            {[...mcp].sort((a, b) => b.toolCount - a.toolCount).slice(0, 6).map((t, i) => (
              <Box key={i}>
                <Box width={5} flexShrink={0}><Text color="redBright">TM{String(i + 1).padStart(2, '0')}</Text></Box>
                <Box flexGrow={1}><Text wrap="truncate">{t.name}</Text></Box>
                <Box flexShrink={0}><Text color="gray">{t.toolCount ? `×${t.toolCount}` : '—'}</Text></Box>
              </Box>
            ))}
            {mcp.length > 6 && <Text color="gray">  … +{mcp.length - 6} more</Text>}
          </Panel>
        </Box>

        {/* Right column */}
        <Box flexDirection="column" width="50%" paddingLeft={1}>
          <Panel title="📊 MOVEPOOL · Model Usage" color="magenta">
            {models.slice(0, 6).map((m, i, arr) => {
              const maxPct = Math.max(...arr.map(x => x.percentage), 1);
              const rel = (m.percentage / maxPct) * 100;
              const filled = Math.max(Math.floor(rel / 100 * 12), m.percentage > 0 ? 1 : 0);
              return (
                <Box key={i}>
                  <Box flexGrow={1}><Text wrap="truncate">{m.name}</Text></Box>
                  <Box flexShrink={0}>
                    <Text>
                      <Text color={hpColor(rel)}>{'▰'.repeat(filled)}</Text>
                      <Text color="gray">{'▱'.repeat(12 - filled)}</Text>
                      {' '}{m.percentage.toFixed(1).padStart(5)}%
                    </Text>
                  </Box>
                </Box>
              );
            })}
          </Panel>

          {skills.length > 0 && (
            <Panel title="📚 SKILLS" color="green">
              <Text color="gray">{skills.length} skills loaded</Text>
              <Text wrap="wrap">{skills.slice(0, 8).map(sk => sk.name).join(', ')}{skills.length > 8 && ` … +${skills.length - 8}`}</Text>
            </Panel>
          )}

          {burn && (
            <Panel title="🔋 PP BURN · Token Usage" color="red">
              {([
                ['Tokens (PP)', <Text bold key="v">{burn.totalTokens >= 1_000_000 ? `${(burn.totalTokens / 1_000_000).toFixed(1)}M` : `${(burn.totalTokens / 1_000).toFixed(1)}K`}</Text>],
                ['Cost', <Text key="v"><Text bold>${burn.estimatedCostUsd.toFixed(2)}</Text><Text color="gray">/mo</Text></Text>],
                ['Velocity', <Text key="v"><Text bold>{burn.tokenVelocity >= 1_000 ? `${(burn.tokenVelocity / 1_000).toFixed(1)}K` : burn.tokenVelocity}</Text><Text color="gray">/min</Text></Text>],
                ['Sessions', <Text bold key="v">{burn.sessionCount}</Text>],
                ['Env Health', <Text key="v"><Text color={burn.envIntegrity >= 0.8 ? 'green' : burn.envIntegrity >= 0.5 ? 'yellow' : 'red'}>{'▰'.repeat(Math.round(burn.envIntegrity * 10))}</Text><Text color="gray">{'▱'.repeat(10 - Math.round(burn.envIntegrity * 10))}</Text> {Math.round(burn.envIntegrity * 100)}%</Text>],
              ] as Array<[string, React.ReactNode]>).map(([label, value], i) => (
                <Box key={i}>
                  <Box width={14} flexShrink={0}><Text color="gray">{label}</Text></Box>
                  {value}
                </Box>
              ))}
            </Panel>
          )}
        </Box>
      </Box>

      {/* Badges */}
      {scoreResult && scoreResult.badges.length > 0 && (
        <Box borderStyle="round" borderColor="yellow" paddingX={1} flexDirection="column" marginBottom={1}>
          <Text bold color="yellow">🏅 BADGES</Text>
          <Box flexWrap="wrap" columnGap={2}>
            {scoreResult.badges.map((b, i) => (
              <Text key={i} color="yellowBright">{b}</Text>
            ))}
          </Box>
        </Box>
      )}

      {/* Status bar */}
      <Box paddingX={1} justifyContent="space-between">
        <Text color="gray" wrap="truncate">
          <Text color={demo ? 'yellow' : 'green'}>{ball} {demo ? 'DEMO' : 'LIVE'}</Text> │ Scan: {scanTime.toFixed(1)}s │ {new Date().toLocaleTimeString()}
        </Text>
        <Box flexShrink={0}><Text color="gray">q quit │ r refresh │ --share card</Text></Box>
      </Box>

      {/* Message */}
      {lastMessage && (
        <Box marginTop={1} paddingX={1}>
          <Text bold color="green">{lastMessage}</Text>
        </Box>
      )}
    </Box>
  );
}
