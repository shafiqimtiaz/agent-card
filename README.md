<div align="center">

# ◓ Pokégent

[![Node.js](https://img.shields.io/badge/node-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Ink](https://img.shields.io/badge/ink-5.0%2B-ff7700?style=flat-square)](https://github.com/vadimdemedes/ink)
[![npm](https://img.shields.io/npm/v/pokegent?style=flat-square&logo=npm)](https://www.npmjs.com/package/pokegent)

Terminal dashboard that shows your Pokémon AI coding ecosystem — 16 Pokémon species (CLI) detectors, TMs/HMs (MCP) discovery, Movepool usage charts, and PP burn metrics.

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Scoring](#scoring) • [Privacy](#privacy)

</div>

Pokégent is a Node.js TUI that scans your local machine to give you a live picture of your Pokémon AI tooling landscape. It detects running AI processes as Pokémon, finds TMs/HMs (installed MCP servers), tallies Movepool (model) usage from shell history, and measures PP burn rates (tokens) — all locally, with zero outbound network requests.

> [!NOTE]
> Pokégent runs entirely locally. No telemetry, no outbound calls, no external services. It reads the process table, configuration directories, and log files on your machine and renders the results in your terminal.

---

## Features

- **16 Pokémon Species Detectors** — Scans for Mewtwo, Venusaur, Blastoise, Pikachu, Eevee, Charizard, Charmander, Gengar, Snorlax, Zubat, Jigglypuff, Ditto, Machamp, Rayquaza, Lapras, and Dragonite.
- **TM/HM (MCP) Discovery** — Aggregates tool servers from `~/.claude`, `~/.cursor`, `~/.opencode`, and other standard config paths.
- **Movepool (Model) Frequency Charts** — Parses terminal history and log files for model mentions, renders horizontal ASCII bars.
- **PP (Token) Burn Analytics** — Sessions, token velocity (PP/min), input/output splits, and estimated costs.
- **Trainer Scoring** — 0-1000 points across Pokémon, TMs/HMs, Movepool, and PP burn metrics.
- **6 Trainer Badges** — Earn 🏆 Pokédex Master, 🦄 Legendary Trainer, 🧬 Hybrid Evolution, 🔥 Blast Burn, 💎 Elite Four, 🌐 Safari Zone Master.

---

## Installation

```bash
# Run directly with npx (zero install)
npx pokegent

# Or install globally
npm install -g pokegent
```

Once installed, start the TUI dashboard by typing:

```bash
pokegent
```

### Build & Run from Source

```bash
git clone https://github.com/shafiqimtiaz/pokegent.git
cd pokegent
npm install
npm run build
npm start
# Run with demo mock data
node dist/index.js --demo
```

---

## Usage

```bash
# Start TUI dashboard with live local scans
pokegent

# Start TUI dashboard in demo mode (with realistic mock data)
pokegent --demo

# Export scanned data in raw JSON format
pokegent --json
```

### Keyboard Shortcuts (TUI Mode)

| Key | Action |
|-----|--------|
| `q` | Quit Pokégent |
| `r` | Force an immediate scan refresh |

---

## Scoring

Your Pokémon, TMs/HMs, Movepool, and PP burn get scored up to 1000 points:

| Dimension | Max Points | How |
|-----------|-----------|-----|
| **Pokémon Running** | 350 pts | 75 pts per active Pokémon (cap 4) + 50 pts bonus for 3+ simultaneous |
| **TMs/HMs (MCP Servers)** | 200 pts | 10 pts per server (cap 15) + 1 pt per tool/move (cap 50) |
| **Movepool Diversity** | 200 pts | 30 pts per unique model (cap 5) + 50 pts for using 3+ providers |
| **PP Burn + Sessions** | 250 pts | Token velocity levels + session count |

### Rarity Tiers

- **900+** — 🌟 MYTHICAL CHAMPION (Top 1%)
- **750+** — 💎 SHINY LEGENDARY (Top 5%)
- **600+** — 🥇 POKÉMON MASTER (Top 15%)
- **400+** — 🥈 GYM LEADER (Top 35%)
- **200+** — 🥉 ELITE TRAINER (Top 60%)
- **<200** — 🌱 BEGINNER TRAINER (Rookie level)

---

## What gets scanned

<details>
<summary><strong>16 Pokémon Species Detectors</strong></summary>

| Pokémon | Platform | Process keyword | Config path |
|---------|----------|----------------|-------------|
| 🔮 Mewtwo | Claude Code | `claude*` | `~/.claude` |
| 🍃 Venusaur | Codex | `codex*` | `~/.codex` |
| 🐢 Blastoise | GitHub Copilot CLI | `copilot*` | `~/.copilot` |
| ⚡ Pikachu | Gemini CLI | `gemini*` | `~/.gemini` |
| 🦊 Eevee | Cursor | `cursor` | `~/.cursor` |
| 🔥 Charizard | Amp | `amp*` | `~/.amp` |
| 🦎 Charmander | Cline | — | `~/.cline` |
| 👻 Gengar | Roo Code | `roo*` | `~/.roo` |
| 🐻 Snorlax | Kilo Code | `kilo*` | `~/.kilo` |
| 🦇 Zubat | Kiro | `kiro` | `~/.kiro` |
| 🎈 Jigglypuff | Crush | — | `~/.crush` |
| 🍮 Ditto | OpenCode | `opencode` | `~/.opencode` |
| 💪 Machamp | Factory Droid | `factory-droid` | `~/.factory-droid` |
| 🐉 Rayquaza | Antigravity | `antigravity*` | `~/.antigravity` |
| ⛵ Lapras | Kimi CLI | `kimi*` | `~/.kimi` |
| 🐉 Dragonite | Qwen Code | `qwen*` | `~/.qwen` |

</details>

<details>
<summary><strong>Scanned Models (19 patterns)</strong></summary>

Scans for occurrences of the following model families in your local history and logs:
- `claude-4-opus`, `claude-4-sonnet`, `claude-3.7-sonnet`, `claude-3.5-sonnet`, `claude-3-haiku`
- `gpt-4.1`, `gpt-4o`, `gpt-4-turbo`, `o4-mini`, `o3`, `o3-mini`, `o3-pro`
- `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.0-flash`
- `deepseek-v3`, `deepseek-r1`, `qwen-3`, `llama-4`

</details>

---

## Privacy

Pokégent runs 100% locally. No data leaves your machine. No telemetry. No analytics. No outbound network requests are made during scanning. All log file parsing, process checking, and configuration scans happen entirely on your computer.
