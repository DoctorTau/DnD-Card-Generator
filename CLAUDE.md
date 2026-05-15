# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A SvelteKit single-page app for generating printable D&D-style card sheets. Users upload card artwork, add a name and description, and the app lays them out on A4 sheets (front + back) for PDF export. The output is designed for duplex printing with accurate card dimensions.

## Commands

```bash
npm run dev        # Start dev server (Vite)
npm run build      # Production build
npm run preview    # Preview the production build
npm test           # Run unit tests (Vitest, browser mode via Playwright)
npm run lint       # Prettier + ESLint check
npm run check      # svelte-check type check
```

Run a single test file:
```bash
npx vitest run src/routes/page.svelte.spec.ts
```

## Architecture

All application logic lives in a single page (`src/routes/+page.svelte`) that holds all state. Components receive props and emit events via callback props — there is no global store.

**Component hierarchy:**
- `+page.svelte` — root state: cards[], layout settings, BG-removal settings
  - `TopBar.svelte` — sticky toolbar: card name/desc input, image drop zone, Add Card / Make PDF buttons
  - `LayoutSettings.svelte` — collapsible panel: card dimensions, grid, parchment, fonts, chroma-key
  - `Sheet.svelte` — one A4 page; renders a CSS grid of `CardCell` components (front or mirrored back)
    - `CardCell.svelte` — single card slot: front (artwork + name band) or back (desc text / `FantasyCover`)
  - `CardPreview.svelte` — live right-rail preview of the card being composed

**Key types (defined in `CardCell.svelte`):**
```ts
type Card = { id: string; name: string; img: string; desc?: string }
```

**PDF export (`src/lib/utils/pdfExport.ts`):**
html2canvas does not honour `object-fit`, so before capture every `img.art` is replaced with a pre-cropped `<canvas>` at the correct cover/contain dimensions. After capture the swaps are reverted. The attribute `data-exporting="true"` on `<html>` gates CSS rules that hide the UI and blank slots during export.

**Chroma-key BG removal** is entirely client-side — pixel-level Euclidean distance in RGB space (`src/routes/+page.svelte: chromaKey()`). No external API.

**Fonts:** Alegreya SC is loaded from Google Fonts for card name ribbons. An optional custom Mookmania woff2 font (user-supplied URL) is injected via a dynamic `<style>` tag for card description backs.

**CSS design tokens** live in `src/app.css`. The palette is dark by default (`--gold`, `--bg`, `--surface`, etc.) with a full light-mode override via `@media (prefers-color-scheme: light)`.

## PDF / Print Constraints

- Cards default to 63.5 × 88.9 mm (standard poker card) arranged on A4 (210 × 297 mm).
- Back sheets use `mirrorRows()` to flip columns left-right for correct duplex alignment.
- A 1 mm `translateY(-1mm)` compensation on `.sheet-back .grid` accounts for printer duplex offset — do not remove this.
- `exportScale` is `max(2, devicePixelRatio)` to ensure ≥192 dpi output.

## Testing Notes

Tests use `vitest-browser-svelte` which requires Playwright (browser mode). The current test suite is minimal; the main test checks the page renders an `<h1>`.

---

# Claude Code Configuration - RuFlo V3

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- NEVER save working files, text/mds, or tests to the root folder
- Never continuously check status after spawning a swarm — wait for results
- ALWAYS read a file before editing it
- NEVER commit secrets, credentials, or .env files

## File Organization

- NEVER save to root folder — use the directories below
- Use `/src` for source code files
- Use `/tests` for test files
- Use `/docs` for documentation and markdown files
- Use `/config` for configuration files
- Use `/scripts` for utility scripts
- Use `/examples` for example code

## Project Architecture

- Follow Domain-Driven Design with bounded contexts
- Keep files under 500 lines
- Use typed interfaces for all public APIs
- Prefer TDD London School (mock-first) for new code
- Use event sourcing for state changes
- Ensure input validation at system boundaries

### Project Config

- **Topology**: hierarchical-mesh
- **Max Agents**: 15
- **Memory**: hybrid
- **HNSW**: Enabled
- **Neural**: Enabled

## Build & Test

```bash
# Build
npm run build

# Test
npm test

# Lint
npm run lint
```

- ALWAYS run tests after making code changes
- ALWAYS verify build succeeds before committing

## Security Rules

- NEVER hardcode API keys, secrets, or credentials in source files
- NEVER commit .env files or any file containing secrets
- Always validate user input at system boundaries
- Always sanitize file paths to prevent directory traversal
- Run `npx @claude-flow/cli@latest security scan` after security-related changes

## Concurrency: 1 MESSAGE = ALL RELATED OPERATIONS

- All operations MUST be concurrent/parallel in a single message
- Use Claude Code's Agent tool for spawning agents, not just MCP
- ALWAYS spawn ALL agents in ONE message with full instructions via Agent tool
- ALWAYS batch ALL file reads/writes/edits in ONE message
- ALWAYS batch ALL Bash commands in ONE message

## Swarm Orchestration

- MUST initialize the swarm using CLI tools when starting complex tasks
- MUST spawn concurrent agents using Claude Code's Agent tool
- Never use CLI tools alone for execution — Agent tool agents do the actual work
- MUST call CLI tools AND Agent tool in ONE message for complex work

### 3-Tier Model Routing (ADR-026)

| Tier | Handler | Latency | Cost | Use Cases |
|------|---------|---------|------|-----------|
| **1** | Agent Booster (WASM) | <1ms | $0 | Simple transforms (var→const, add types) — Skip LLM |
| **2** | Haiku | ~500ms | $0.0002 | Simple tasks, low complexity (<30%) |
| **3** | Sonnet/Opus | 2-5s | $0.003-0.015 | Complex reasoning, architecture, security (>30%) |

- For Tier 1 simple transforms, use Edit tool directly — no LLM agent needed

## Swarm Configuration & Anti-Drift

- ALWAYS use hierarchical topology for coding swarms
- Keep maxAgents at 6-8 for tight coordination
- Use specialized strategy for clear role boundaries
- Use `raft` consensus for hive-mind (leader maintains authoritative state)
- Run frequent checkpoints via `post-task` hooks
- Keep shared memory namespace for all agents

```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

## Swarm Execution Rules

- ALWAYS use `run_in_background: true` for all Agent tool calls
- ALWAYS put ALL Agent calls in ONE message for parallel execution
- After spawning, STOP — do NOT add more tool calls or check status
- Never poll agent status repeatedly — trust agents to return
- When agent results arrive, review ALL results before proceeding

## V3 CLI Commands

### Core Commands

| Command | Subcommands | Description |
|---------|-------------|-------------|
| `init` | 4 | Project initialization |
| `agent` | 8 | Agent lifecycle management |
| `swarm` | 6 | Multi-agent swarm coordination |
| `memory` | 11 | AgentDB memory with HNSW search |
| `task` | 6 | Task creation and lifecycle |
| `session` | 7 | Session state management |
| `hooks` | 17 | Self-learning hooks + 12 workers |
| `hive-mind` | 6 | Byzantine fault-tolerant consensus |

### Quick CLI Examples

```bash
npx @claude-flow/cli@latest init --wizard
npx @claude-flow/cli@latest agent spawn -t coder --name my-coder
npx @claude-flow/cli@latest swarm init --v3-mode
npx @claude-flow/cli@latest memory search --query "authentication patterns"
npx @claude-flow/cli@latest doctor --fix
```

## Available Agents (16 Roles + Custom)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Specialized
`security-architect`, `security-auditor`, `memory-specialist`, `performance-engineer`

### Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`

### GitHub & Repository
`pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`

Any string can be used as a custom agent type — these are the typed roles with specialized behavior.

## Memory & Vector Search

### MCP Tools (use via ToolSearch to discover)

| Tool | Description |
|------|-------------|
| `memory_store` | Store value with ONNX 384-dim vector embedding |
| `memory_search` | Semantic vector search by query |
| `memory_retrieve` | Get entry by key |
| `memory_list` | List entries in namespace |
| `memory_delete` | Delete entry |
| `memory_import_claude` | Import Claude Code memories into AgentDB (allProjects=true for all) |
| `memory_search_unified` | Search across ALL namespaces (Claude + AgentDB + patterns) |
| `memory_bridge_status` | Show bridge health, vectors, SONA, intelligence |

### CLI Commands

```bash
# Store with vector embedding
npx @claude-flow/cli@latest memory store --key "pattern-auth" --value "JWT with refresh" --namespace patterns

# Semantic search
npx @claude-flow/cli@latest memory search --query "authentication patterns"

# Import all Claude Code memories into AgentDB
node .claude/helpers/auto-memory-hook.mjs import-all
```

### Claude Code ↔ AgentDB Bridge

Claude Code auto-memory files (`~/.claude/projects/*/memory/*.md`) are automatically imported into AgentDB with ONNX vector embeddings on session start. Use `memory_search_unified` to search across both stores.

## Key MCP Tools (314 available — use ToolSearch to discover)

### Most Used Tools

| Category | Tools | What They Do |
|----------|-------|-------------|
| **Memory** | `memory_store`, `memory_search`, `memory_search_unified` | Store/search with ONNX vector embeddings |
| **Claude Bridge** | `memory_import_claude`, `memory_bridge_status` | Import Claude memories into AgentDB |
| **Swarm** | `swarm_init`, `swarm_status`, `swarm_health` | Multi-agent coordination |
| **Agents** | `agent_spawn`, `agent_list`, `agent_status` | Agent lifecycle |
| **Hive-Mind** | `hive-mind_init`, `hive-mind_spawn`, `hive-mind_consensus` | Byzantine/Raft consensus |
| **Hooks** | `hooks_route`, `hooks_session-start`, `hooks_post-task` | Task routing + learning |
| **Workers** | `hooks_worker-list`, `hooks_worker-dispatch` | 12 background workers |
| **Security** | `aidefence_scan`, `aidefence_is_safe` | Prompt injection detection |
| **Intelligence** | `hooks_intelligence`, `neural_status` | Pattern learning + SONA |

### Swarm Capabilities

- **Topologies**: hierarchical (anti-drift), mesh, ring, star, adaptive
- **Consensus**: Raft (leader-based), Byzantine (PBFT), Gossip (eventual)
- **Hive-Mind**: Queen-led coordination with spawn, broadcast, consensus voting, shared memory
- **12 Background Workers**: audit, optimize, testgaps, map, deepdive, document, refactor, benchmark, ultralearn, consolidate, predict, preload

### Memory Capabilities

- **ONNX Embeddings**: all-MiniLM-L6-v2, 384 dimensions — real neural vectors
- **DiskANN**: SSD-friendly vector search (8,000x faster insert than HNSW, perfect recall at 1K)
- **sql.js**: Cross-platform SQLite (WASM, no native compilation)
- **Claude Code Bridge**: Auto-imports MEMORY.md files into AgentDB on session start
- **Unified Search**: `memory_search_unified` searches Claude memories + AgentDB + patterns
- **SONA Learning**: Trajectory recording → pattern extraction → file persistence

### How to Discover Tools

Use ToolSearch to find specific tools:
```
ToolSearch("memory search")     → memory_store, memory_search, memory_search_unified
ToolSearch("swarm")             → swarm_init, swarm_status, swarm_health, swarm_shutdown
ToolSearch("hive consensus")    → hive-mind_consensus, hive-mind_status
ToolSearch("+aidefence")        → aidefence_scan, aidefence_is_safe, aidefence_has_pii
```

## Quick Setup

```bash
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest doctor --fix
```

## Claude Code vs MCP Tools

- **Claude Code Agent tool** handles execution: agents, file ops, code generation, git
- **MCP tools** (via ToolSearch) handle coordination: swarm, memory, hooks, routing, hive-mind
- **CLI commands** (via Bash) are the same tools with terminal output
- Use `ToolSearch("keyword")` to discover available MCP tools

## Support

- Documentation: https://github.com/ruvnet/ruflo
- Issues: https://github.com/ruvnet/ruflo/issues
