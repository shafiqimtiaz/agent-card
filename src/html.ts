import os from 'os';
import type { CliStatus, McpTool, ModelUsage, BurnMetrics, SkillInfo, ScoreResult } from './types.js';
import { rarityLabel } from './scoring.js';
import { VERSION } from './constants.js';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

const STATE_LABEL: Record<CliStatus['state'], string> = {
  RUNNING: 'active',
  IDLE: 'resting',
  DETECTED: 'in box',
  ABSENT: 'absent',
};

export function generateTrainerCard(
  clis: CliStatus[],
  mcp: McpTool[],
  models: ModelUsage[],
  burn: BurnMetrics,
  score: ScoreResult,
  skills: SkillInfo[] = [],
): string {
  const detected = clis.filter(c => c.state === 'RUNNING' || c.state === 'IDLE');
  const running = detected.filter(c => c.state === 'RUNNING');
  const totalTools = mcp.reduce((sum, t) => sum + t.toolCount, 0);
  const sortedMcp = [...mcp].sort((a, b) => b.toolCount - a.toolCount);
  const shownMcp = sortedMcp.slice(0, 18);
  const topModels = models.slice(0, 6);
  const rank = rarityLabel(score.total);
  const date = new Date().toISOString().slice(0, 10);
  const trainer = os.userInfo().username;
  const trainerId = String(10000 + (burn.totalTokens % 90000)).padStart(5, '0');

  const statsText = `My AI coding ecosystem — ${score.total} pts, ${rank}. ${running.length} agents active · ${mcp.length} MCP servers / ${totalTools} tools · ${fmtTokens(burn.totalTokens)} tokens burned. Get your Trainer Card: npx pokegent`;
  const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(statsText)}`;
  const ogDescription = `${score.total} pts · ${running.length} agents active · ${mcp.length} MCP servers · ${fmtTokens(burn.totalTokens)} tokens`;

  const rosterOverflow = detected.length > 8
    ? `<li class="mon mon-more reveal" style="--d:0.95s">+${detected.length - 8} more</li>`
    : '';
  const rosterHtml = detected.slice(0, 8).map((c, i) => `
        <li class="mon reveal" style="--d:${0.35 + i * 0.07}s">
          ${c.pokemonId
            ? `<img class="sprite" src="${SPRITE_BASE}/${c.pokemonId}.png" alt="${esc(c.pokemonName ?? c.name)}" loading="lazy" onerror="this.replaceWith(document.createTextNode('${esc(c.icon)}'))">`
            : `<span class="sprite-fallback">${esc(c.icon)}</span>`}
          <span class="mon-species">${esc(c.pokemonName ?? c.name)}</span>
          <span class="mon-cli">${esc(c.name)}</span>
          <span class="chip chip-${c.state.toLowerCase()}">${STATE_LABEL[c.state]}${c.state === 'RUNNING' ? ` · ${c.cpuPct.toFixed(1)}%` : ''}</span>
        </li>`).join('');

  const tmsOverflow = sortedMcp.length > 18
    ? `<li class="tm tm-more reveal" style="--d:1.3s">+${sortedMcp.length - 18} more</li>`
    : '';
  const tmsHtml = shownMcp.map((t, i) => `
        <li class="tm reveal" style="--d:${0.5 + i * 0.04}s" title="${esc(t.description)}">
          <span class="tm-no">TM${String(i + 1).padStart(2, '0')}</span>
          <span class="tm-name">${esc(t.name)}</span>
          <span class="tm-count">${t.toolCount ? `×${t.toolCount}` : '—'}</span>
        </li>`).join('');

  const maxPct = Math.max(...topModels.map(m => m.percentage), 1);
  const movesHtml = topModels.map((m, i) => {
    const rel = (m.percentage / maxPct) * 100;
    return `
          <li class="move reveal" style="--d:${0.6 + i * 0.05}s">
            <span class="move-name">${esc(m.name)}</span>
            <span class="hpbar"><span class="hpbar-fill ${rel > 50 ? 'hp-hi' : rel > 20 ? 'hp-mid' : 'hp-lo'}" style="--w:${Math.max(rel, 2)}%"></span></span>
            <span class="move-pct">${m.percentage.toFixed(1)}%</span>
          </li>`;
  }).join('');

  const skillsHtml = skills.slice(0, 24).map((s, i) =>
    `<span class="skill reveal" style="--d:${0.6 + i * 0.03}s">${esc(s.name)}</span>`
  ).join('');
  const skillsOverflow = skills.length > 24 ? `<span class="skill skill-more">+${skills.length - 24}</span>` : '';

  const badgesHtml = score.badges.length
    ? score.badges.map((b, i) => `<li class="badge reveal" style="--d:${0.8 + i * 0.08}s"><span>${esc(b)}</span></li>`).join('')
    : '<li class="badge badge-empty reveal" style="--d:0.8s"><span>No badges yet — train harder</span></li>';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pokégent Trainer Card — ${score.total} pts</title>
<meta property="og:title" content="Pokégent Trainer Card — ${score.total} pts">
<meta property="og:description" content="${esc(ogDescription)}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet">
<style>
:root {
  --ink: #16130f;
  --cream: #f3ead6;
  --cream-dim: #e7dcc2;
  --paper-line: #d8cbae;
  --dex-red: #d5232e;
  --dex-red-deep: #9c1420;
  --gold: #d9a520;
  --leaf: #2e9e4f;
  --sun: #e0a11b;
  --ember: #d5232e;
  --night: #0d1220;
  --pixel: 'Press Start 2P', monospace;
  --mono: 'IBM Plex Mono', monospace;
}
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 48px 16px;
  font-family: var(--mono);
  font-size: 14px;
  color: var(--ink);
  background:
    radial-gradient(ellipse 90% 60% at 50% -10%, #1d2a4a 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 85% 100%, #33121a 0%, transparent 55%),
    var(--night);
}
body::before {
  content: '';
  position: fixed; inset: 0;
  background:
    repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 3px);
  pointer-events: none;
  z-index: 3;
}
body::after {
  content: '';
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}

.card {
  position: relative;
  width: min(780px, 100%);
  background: var(--cream);
  border: 4px solid var(--ink);
  box-shadow: 10px 10px 0 var(--ink), 10px 10px 0 4px rgba(213,35,46,0.55), 0 30px 80px rgba(0,0,0,0.6);
  z-index: 2;
  animation: card-in 0.6s cubic-bezier(0.2, 0.9, 0.25, 1.2) both;
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(28px) rotate(-1deg); }
  to   { opacity: 1; transform: translateY(0) rotate(0); }
}
.reveal { animation: rise 0.5s cubic-bezier(0.2, 0.8, 0.3, 1) both; animation-delay: var(--d, 0s); }
@keyframes rise {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── header band ── */
.head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 18px 24px;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.14), transparent 45%),
    var(--dex-red);
  border-bottom: 4px solid var(--ink);
  color: #fff;
}
.head .title { font-family: var(--pixel); font-size: 15px; letter-spacing: 1px; text-shadow: 2px 2px 0 var(--dex-red-deep); }
.head .meta { font-size: 12px; opacity: 0.9; text-align: right; line-height: 1.5; }
.lens {
  width: 30px; height: 30px; flex: none; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #cfeaff 0 18%, #3aa0e8 40%, #14538e 100%);
  border: 3px solid var(--ink);
  box-shadow: inset -2px -2px 0 rgba(0,0,0,0.35);
  animation: lens-blink 4s steps(1) infinite;
}
@keyframes lens-blink {
  0%, 88%, 96%, 100% { filter: brightness(1); }
  92% { filter: brightness(1.8); }
}

/* ── score strip ── */
.score-strip {
  position: relative; overflow: hidden;
  display: flex; align-items: baseline; flex-wrap: wrap; gap: 10px 20px;
  padding: 26px 24px 20px;
  background:
    repeating-linear-gradient(0deg, transparent 0 28px, var(--paper-line) 28px 29px),
    var(--cream);
  border-bottom: 3px solid var(--ink);
}
.score-strip::before {
  content: '';
  position: absolute; right: -36px; top: -30px;
  width: 170px; height: 170px; border-radius: 50%;
  background:
    radial-gradient(circle at center, #fff 0 16px, var(--ink) 16px 24px, transparent 24px),
    linear-gradient(180deg, var(--dex-red) 0 45%, var(--ink) 45% 55%, #fff 55% 100%);
  opacity: 0.13;
  pointer-events: none;
}
.score-strip > * { position: relative; }
.score-num {
  font-family: var(--pixel);
  font-size: 54px;
  color: var(--dex-red);
  text-shadow: 4px 4px 0 rgba(22,19,15,0.18);
}
.score-unit { font-family: var(--pixel); font-size: 12px; color: var(--ink); }
.rank {
  margin-left: auto;
  font-size: 14px; font-weight: 700;
  padding: 7px 12px;
  background: var(--ink); color: var(--cream);
  box-shadow: 3px 3px 0 rgba(22,19,15,0.25);
}
.trainer-line { width: 100%; font-size: 13px; letter-spacing: 0.5px; }
.trainer-line b { text-transform: uppercase; }
.trainer-line .idno { color: var(--dex-red); font-weight: 700; }
.subscores { width: 100%; font-size: 12px; letter-spacing: 0.5px; color: #6f6552; }
.subscores b { color: var(--ink); }

/* ── sections ── */
section { padding: 20px 24px; }
section + section, .cols + section, section + .cols { border-top: 3px solid var(--ink); }
h2 {
  font-family: var(--pixel);
  font-size: 11px;
  letter-spacing: 1px;
  white-space: nowrap;
  margin-bottom: 16px;
  display: flex; align-items: center; gap: 10px;
}
h2::after { content: ''; flex: 1; min-width: 12px; height: 3px; background: repeating-linear-gradient(90deg, var(--ink) 0 6px, transparent 6px 12px); }
h2 .tag { font-family: var(--mono); font-size: 12px; font-weight: 700; color: var(--dex-red); }

/* ── team roster ── */
.roster { list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 10px; }
.mon {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  grid-template-areas: 'sprite species chip' 'sprite cli chip';
  align-items: center; column-gap: 14px;
  padding: 10px 12px;
  background: var(--cream-dim);
  border: 2px solid var(--ink);
  box-shadow: 3px 3px 0 rgba(22,19,15,0.2);
  transition: transform 0.15s, box-shadow 0.15s;
}
.mon:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 rgba(22,19,15,0.3); }
.sprite, .sprite-fallback { grid-area: sprite; width: 56px; height: 56px; image-rendering: pixelated; font-size: 36px; line-height: 56px; text-align: center; }
.mon:hover .sprite { animation: hop 0.4s steps(2) infinite; }
@keyframes hop { 50% { transform: translateY(-4px); } }
.mon-species { grid-area: species; font-weight: 700; font-size: 15px; }
.mon-cli { grid-area: cli; font-size: 12px; color: #6f6552; }
.chip {
  grid-area: chip;
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  padding: 4px 9px; border: 2px solid var(--ink); background: #cfc7b2;
}
.chip-running { background: var(--leaf); color: #fff; }
.chip-idle { background: var(--sun); color: var(--ink); }
.chip-detected { background: #cfc7b2; color: var(--ink); }
.mon-more { display: flex; align-items: center; justify-content: center; font-size: 12px; color: #6f6552; box-shadow: none; border-style: dashed; }

/* ── skills list ── */
.skill-list { display: flex; flex-wrap: wrap; gap: 6px; }
.skill {
  font-size: 11px; font-weight: 500;
  padding: 4px 10px;
  background: var(--cream-dim);
  border: 2px solid var(--ink);
  box-shadow: 2px 2px 0 rgba(22,19,15,0.15);
  transition: transform 0.1s, box-shadow 0.1s;
}
.skill:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 rgba(22,19,15,0.25); }
.skill-more { border-style: dashed; background: transparent; color: #6f6552; }

/* ── TM grid (full MCP arsenal) ── */
.tm-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(215px, 1fr));
  gap: 8px;
  font-size: 13px;
}
.tm {
  display: flex; align-items: baseline; gap: 8px;
  padding: 7px 10px;
  background: var(--cream-dim);
  border: 2px solid var(--ink);
  box-shadow: 2px 2px 0 rgba(22,19,15,0.18);
  transition: transform 0.12s, box-shadow 0.12s;
}
.tm:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 rgba(22,19,15,0.28); }
.tm-no { font-family: var(--pixel); font-size: 8px; color: var(--dex-red); flex: none; }
.tm-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
.tm-count { margin-left: auto; color: #6f6552; flex: none; font-size: 12px; }
.tm-more { justify-content: center; color: #6f6552; box-shadow: none; border-style: dashed; background: transparent; }

/* ── two columns ── */
.cols { display: grid; grid-template-columns: 1fr 1fr; }
.cols > section { border-top: none; }
.cols > section + section { border-left: 3px solid var(--ink); }
@media (max-width: 620px) {
  .cols { grid-template-columns: 1fr; }
  .cols > section + section { border-left: none; border-top: 3px solid var(--ink); }
}

.move-list { list-style: none; display: flex; flex-direction: column; gap: 9px; }
.move { display: grid; grid-template-columns: 1fr; row-gap: 4px; }
.move-name { font-size: 12px; font-weight: 500; }
.hpbar {
  display: block; height: 12px;
  border: 2px solid var(--ink);
  background: #cfc7b2;
  position: relative;
}
.hpbar-fill {
  position: absolute; inset: 0;
  width: var(--w);
  transform-origin: left;
  animation: hp-fill 0.9s cubic-bezier(0.2, 0.8, 0.3, 1) both;
  animation-delay: calc(var(--d, 0s) + 0.2s);
}
@keyframes hp-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.hp-hi  { background: repeating-linear-gradient(90deg, var(--leaf) 0 4px, #47b864 4px 8px); }
.hp-mid { background: repeating-linear-gradient(90deg, var(--sun) 0 4px, #f0b53b 4px 8px); }
.hp-lo  { background: repeating-linear-gradient(90deg, var(--ember) 0 4px, #e64a54 4px 8px); }
.move-pct { font-size: 11px; color: #6f6552; justify-self: end; }

/* ── PP stat tiles ── */
.pp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.pp-tile {
  padding: 14px 10px;
  border: 2px solid var(--ink);
  background: var(--cream-dim);
  box-shadow: 3px 3px 0 rgba(22,19,15,0.2);
  text-align: center;
}
.pp-val { font-family: var(--pixel); font-size: 16px; color: var(--ink); display: block; margin-bottom: 7px; }
.pp-key { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6f6552; }

/* ── badges ── */
.badge-list { list-style: none; display: flex; flex-wrap: wrap; gap: 10px; }
.badge {
  position: relative; overflow: hidden;
  font-size: 13px; font-weight: 700;
  padding: 7px 14px;
  border: 2px solid var(--ink);
  background: linear-gradient(135deg, #f6d878, var(--gold) 55%, #b07d10);
  box-shadow: 3px 3px 0 rgba(22,19,15,0.25);
}
.badge > span { position: relative; z-index: 1; }
.badge::after {
  content: '';
  position: absolute; top: -20%; bottom: -20%; width: 30%; left: -40%;
  background: linear-gradient(105deg, transparent, rgba(255,255,255,0.55), transparent);
  animation: holo 3.2s ease-in-out infinite;
}
@keyframes holo { 0%, 55% { left: -40%; } 85%, 100% { left: 130%; } }
.badge-empty { background: var(--cream-dim); color: #6f6552; font-weight: 400; }
.badge-empty::after { display: none; }

/* ── share strip ── */
.share {
  display: flex; align-items: center; flex-wrap: wrap; gap: 12px;
  padding: 18px 24px;
  border-top: 3px solid var(--ink);
  background: var(--cream-dim);
}
.share-label { font-family: var(--pixel); font-size: 9px; letter-spacing: 1px; margin-right: auto; }
.btn {
  font-family: var(--pixel); font-size: 9px; letter-spacing: 0.5px;
  display: inline-block;
  padding: 10px 16px;
  color: var(--cream); background: var(--ink);
  border: 2px solid var(--ink);
  box-shadow: 3px 3px 0 rgba(22,19,15,0.35);
  text-decoration: none; cursor: pointer;
  transition: transform 0.08s, box-shadow 0.08s;
}
.btn:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 rgba(22,19,15,0.4); }
.btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 rgba(22,19,15,0.4); }
.btn-x { background: var(--dex-red); }

/* ── footer ── */
footer {
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  padding: 16px 24px;
  border-top: 4px solid var(--ink);
  background: var(--ink); color: var(--cream);
  font-size: 12px;
}
footer .cta { font-family: var(--pixel); font-size: 10px; color: var(--gold); animation: blink 1.6s steps(2) infinite; }
@keyframes blink { 50% { opacity: 0.35; } }
</style>
</head>
<body>
<main class="card">
  <header class="head">
    <span class="lens" aria-hidden="true"></span>
    <span class="title">POKÉGENT · TRAINER CARD</span>
    <span class="meta">v${VERSION}<br>${date}</span>
  </header>

  <div class="score-strip">
    <span class="score-num reveal" style="--d:0.1s">${score.total}</span>
    <span class="score-unit reveal" style="--d:0.15s">PTS</span>
    <span class="rank reveal" style="--d:0.2s">${esc(rank)}</span>
    <span class="trainer-line reveal" style="--d:0.25s">TRAINER <b>${esc(trainer)}</b> · <span class="idno">ID No. ${trainerId}</span></span>
    <span class="subscores reveal" style="--d:0.3s">AGENTS <b>${score.agentsScore}</b> · TMs <b>${score.mcpScore}</b> · MOVES <b>${score.modelsScore}</b> · PP <b>${score.burnScore}</b></span>
  </div>

  <section>
    <h2>🎒 Team <span class="tag">${running.length} active / ${detected.length} caught</span></h2>
    <ul class="roster">${rosterHtml}${rosterOverflow}
    </ul>
  </section>

  <section>
    <h2>💿 TMs &amp; HMs <span class="tag">${mcp.length} servers · ${totalTools} tools</span></h2>
    <ul class="tm-list">${tmsHtml}${tmsOverflow}
    </ul>
  </section>

  <div class="cols">
    <section>
      <h2>📊 Movepool <span class="tag">models</span></h2>
      <ul class="move-list">${movesHtml}
      </ul>
    </section>
    <section>
      <h2>🔋 PP Burn</h2>
      <div class="pp-grid">
        <div class="pp-tile reveal" style="--d:0.65s"><span class="pp-val">${fmtTokens(burn.totalTokens)}</span><span class="pp-key">Tokens</span></div>
        <div class="pp-tile reveal" style="--d:0.7s"><span class="pp-val">$${burn.estimatedCostUsd.toFixed(2)}</span><span class="pp-key">Cost / mo</span></div>
        <div class="pp-tile reveal" style="--d:0.75s"><span class="pp-val">${fmtTokens(burn.tokenVelocity)}/m</span><span class="pp-key">Velocity</span></div>
        <div class="pp-tile reveal" style="--d:0.8s"><span class="pp-val">${burn.sessionCount}</span><span class="pp-key">Sessions</span></div>
      </div>
    </section>
  </div>

  ${skills.length > 0 ? `
  <section>
    <h2>📚 Skills <span class="tag">${skills.length} known</span></h2>
    <div class="skill-list">${skillsHtml}${skillsOverflow}</div>
  </section>` : ''}

  <section>
    <h2>🏅 Badges</h2>
    <ul class="badge-list">${badgesHtml}
    </ul>
  </section>

  <div class="share">
    <span class="share-label">SHOW IT OFF</span>
    <button class="btn" data-stats="${esc(statsText)}" onclick="copyStats(this)">COPY STATS</button>
    <a class="btn btn-x" href="${esc(tweetUrl)}" target="_blank" rel="noopener">SHARE ON X</a>
  </div>

  <footer>
    <span>Generated by Pokégent — your AI coding ecosystem, as a Pokémon team.</span>
    <span class="cta">npx pokegent</span>
  </footer>
</main>
<script>
function copyStats(btn) {
  navigator.clipboard.writeText(btn.dataset.stats).then(function () {
    btn.textContent = 'COPIED!';
    setTimeout(function () { btn.textContent = 'COPY STATS'; }, 1500);
  });
}
</script>
</body>
</html>
`;
}
