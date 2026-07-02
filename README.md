<div align="center">

# ◓ Pokégent

[![npm](https://img.shields.io/npm/v/pokegent?style=flat-square&logo=npm)](https://www.npmjs.com/package/pokegent)
[![Node](https://img.shields.io/badge/node-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Ink](https://img.shields.io/badge/ink-5.0%2B-ff7700?style=flat-square)](https://github.com/vadimdemedes/ink)
[![License](https://img.shields.io/npm/l/pokegent?style=flat-square)](LICENSE)

Terminal dashboard + shareable HTML Trainer Card for your AI coding ecosystem.

Your coding agents become Pokémon species, MCP servers become TMs/HMs, installed skills fill your Move Tutor log, and token burn tracks as PP.

[Features](#features) · [Installation](#installation) · [Usage](#usage) · [Trainer Card](#trainer-card) · [Scoring](#scoring) · [Privacy](#privacy)

</div>

Pokégent scans your local machine to give you a live picture of your AI tooling landscape. It detects running AI processes, finds installed MCP servers, discovers skills, tallies model usage from shell history, and measures token burn rates — all locally with zero outbound requests.

> **Note**  
> Pokégent runs 100% locally. It reads the process table, configuration directories, and log files on your machine and renders the results in your terminal. No telemetry, no network calls, no data leaves your computer.

---

## Features

- **16 agent detectors** — Mewtwo (Claude Code), Pikachu (Gemini CLI), Ditto (OpenCode), and more. Each detected process gets a Pokémon species, sprite, and live CPU/memory stats.
- **MCP server discovery** — Scans `~/.claude.json`, `~/.cursor/mcp.json`, `~/.opencode/config.json`, `~/.n8n/mcp.json`, and per-project MCP configs. Full arsenal displayed as TM-numbered chips.
- **Skills inventory** — Discovers installed skills from `~/.claude/skills`, `~/.agents/skills`, and `~/.config/opencode/skills`.
- **Model usage charts** — Parses terminal history and log files for model mentions. Renders horizontal HP-style bars with relative-to-top scaling.
- **Token burn analytics** — Session count from `.jsonl` transcripts, token velocity (PP/min), input/output splits, estimated monthly cost.
- **Shareable HTML Trainer Card** — Self-contained card with trainer ID, full MCP arsenal grid, team roster with sprites, PP stat tiles, badges, and one-click COPY STATS + SHARE ON X.
- **Scoring engine** — 0–1000 points across agents, MCP, models, skills, and burn. Rarity tiers from Beginner Trainer to Mythical Champion. 7 unlockable badges.

---

## Installation

```bash
# Run directly (zero install)
npx pokegent

# Or install globally
npm install -g pokegent
```

### From source

```bash
git clone https://github.com/shafiqimtiaz/pokegent.git
cd pokegent
npm install
npm run build
```

---

## Usage

```bash
# Start the TUI dashboard (live scan)
pokegent

# Demo mode with realistic mock data
pokegent --demo

# Export scanned data as JSON
pokegent --json

# Generate the shareable HTML Trainer Card
pokegent --share
```

| Key | Action |
|-----|--------|
| `q` | Quit |
| `r` | Force scan refresh |

---

## Trainer Card

The `--share` flag generates a self-contained HTML file at `~/Desktop/pokegent-card.html`.

The card includes:

- **Trainer identity** — Your username + ID No. derived from token burn.
- **Score strip** — Total score, rarity rank, per-dimension breakdown.
- **Team roster** — All detected agents with Pokémon sprites from PokeAPI, species name, CLI name, and state chip (active/resting/in box).
- **MCP arsenal** — Full TM grid (up to 18 servers) with tool counts and descriptions on hover.
- **Skills** — Installed skills listed as tagged chips.
- **Movepool** — Model usage with animated HP bars, relative scaling.
- **PP Burn tiles** — Tokens, cost, velocity, session count.
- **Badges** — Unlocked achievements with holo shine animation.
- **Share strip** — COPY STATS button (clipboard) + SHARE ON X (prefilled tweet).

```bash
pokegent --demo --share   # Generate card with mock data
```

---

## Scoring

| Dimension | Max | How |
|-----------|-----|-----|
| **Agents** | 350 pts | 75 pts per running agent (cap 4) + 50 if 3+ active |
| **MCP servers** | 200 pts | 10 pts per server (cap 15) + 1 per tool (cap 50) |
| **Models** | 200 pts | 30 pts per model (cap 5) + 50 for 3+ providers |
| **Skills** | 100 pts | 5 pts per skill (cap 20) |
| **Token burn** | 250 pts | Velocity tiers + session milestones |

### Rarity tiers

| Score | Title |
|-------|-------|
| 900+ | 🌟 Mythical Champion — Top 1% |
| 750+ | 💎 Shiny Legendary — Top 5% |
| 600+ | 🥇 Pokémon Master — Top 15% |
| 400+ | 🥈 Gym Leader — Top 35% |
| 200+ | 🥉 Elite Trainer — Top 60% |
| <200 | 🌱 Beginner Trainer |

### Badges

| Badge | Condition |
|-------|-----------|
| 🏆 Pokédex Master | 10+ MCP servers |
| 🦄 Legendary Trainer | 3+ agents running |
| 🧬 Hybrid Evolution | 3+ model providers |
| 🔥 Blast Burn | 10K+ tokens/min velocity |
| 💎 Elite Four | 100+ sessions |
| 🌐 Safari Zone Master | 5+ models detected |
| 📚 Move Tutor | 20+ skills installed |

---

## What gets scanned

<details>
<summary><strong>Agent detectors (16)</strong></summary>

| Pokémon | Platform | Process | Config paths |
|---------|----------|---------|-------------|
| 🔮 Mewtwo | Claude Code | `claude`, `claude-code` | `~/.claude`, `~/.claude.json` |
| 🍃 Venusaur | Codex | `codex`, `openai-codex` | `~/.codex` |
| 🐢 Blastoise | Copilot CLI | `copilot`, `github-copilot` | `~/.copilot` |
| ⚡ Pikachu | Gemini CLI | `gemini`, `gemini-cli` | `~/.gemini` |
| 🦊 Eevee | Cursor | `cursor` | `~/.cursor` |
| 🔥 Charizard | Amp | `amp`, `amp-cli` | `~/.amp` |
| 🦎 Charmander | Cline | `cline` | `~/.cline` |
| 👻 Gengar | Roo Code | `roo`, `roo-code` | `~/.roo` |
| 🐻 Snorlax | Kilo Code | `kilo`, `kilo-code` | `~/.kilo` |
| 🦇 Zubat | Kiro | `kiro` | `~/.kiro` |
| 🎈 Jigglypuff | Crush | `crush` | `~/.crush` |
| 🍮 Ditto | OpenCode | `opencode` | `~/.opencode` |
| 💪 Machamp | Factory Droid | `factory`, `factory-droid` | `~/.factory-droid` |
| 🐉 Rayquaza | Antigravity | `antigravity`, `ag-cli` | `~/.antigravity` |
| ⛵ Lapras | Kimi CLI | `kimi`, `kimi-cli` | `~/.kimi` |
| 🐉 Dragonite | Qwen Code | `qwen`, `qwen-code` | `~/.qwen` |

</details>

<details>
<summary><strong>MCP config paths</strong></summary>

- `~/.claude.json` (including per-project `mcpServers`)
- `~/.claude/mcpServers.json`
- `~/.claude/config.json`
- `~/.config/claude/settings.json`
- `~/.cursor/mcp.json`
- `~/.opencode/config.json`
- `~/.roo/mcp.json`
- `~/.kilo/mcp.json`
- `~/.n8n/mcp.json`

</details>

<details>
<summary><strong>Skill scan directories</strong></summary>

- `~/.claude/skills`
- `~/.agents/skills`
- `~/.config/opencode/skills`

</details>

<details>
<summary><strong>Model patterns (24+)</strong></summary>

Anthropic: Claude Fable 5, Sonnet 5, Opus 4.8/4.5/4.1, Sonnet 4.5, Haiku 4.5, 4 Opus, 4 Sonnet, 3.7 Sonnet, 3.5 Sonnet, 3 Haiku.  
OpenAI: GPT-5, GPT-4.1, GPT-4o, o4-mini, o3, o3-mini.  
Google: Gemini 3, 2.5 Pro, 2.5 Flash.  
Other: DeepSeek V3/R1, Qwen 3, Llama 4.

</details>

---

## Privacy

Pokégent runs 100% locally. No data leaves your machine. No telemetry, no analytics, no outbound network requests during scanning. All process table reads, configuration file scans, and log parsing happen entirely on your computer. The `--share` card is written as a local HTML file on your desktop — sharing it is your choice.
