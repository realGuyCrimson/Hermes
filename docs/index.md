---
title: Hermes Agent Admin Wiki
type: index
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [operational-invariants, triaging-hermes-health, hermes-agent]
---

# Hermes Agent Admin Wiki

> A distilled, cross-linked reference for setting up, configuring, diagnosing and fixing a **Hermes Agent** install (`~/.hermes`) from Claude Code. Built from one source: [[hermes-admin-deep-research]]. Not an Obsidian vault: plain Markdown with wikilinks (double square brackets around a file name without `.md`, for example [[hermes-home]]); file names are unique across folders, so no path is needed.

## Start here

1. [[operational-invariants]]: seven rules before touching anything.
2. [[triaging-hermes-health]]: the "something is wrong" procedure.
3. [[hermes-home]]: where every file lives. [[hermes-cli]]: every command and exit code. [[config-yaml]]: where every key is documented.
4. Unknown flag? Check [[hermes-online-docs]].

## Symptom to page

| Symptom | Page |
|---|---|
| "another Hermes process still holds an old copy of the session database's write-ahead log" | [[resolving-wal-lock-refusals]] |
| `SQLITE_CORRUPT`, `SQLITE_NOTADB`, `StateDbCorruptError`, `fts_stale`, search degraded | [[repairing-state-db]] |
| CLI exit code 3, "Turn lost during restart", conversation paused | [[clearing-interrupted-turns]] |
| Need a clean stop before any repair | [[enforcing-zero-process-barrier]] |
| Missing Python module or tool, Node/TUI will not start, chromium/cua-driver missing | [[repairing-package-environment]] |
| `hermes update` fails or hangs | [[updating-hermes]], [[fixing-platform-pitfalls]] |
| `node: command not found`, slow or hung terminal commands | [[fixing-terminal-environment]] |
| `hermes config set` refused, setting ignored, `$VAR` not expanded | [[setting-config-values]], [[managed-scope]], [[remote-config-mode]], [[secrets-vs-config-split]] |
| 401/429 loops, provider outage, key rotation | [[managing-credential-pools-and-fallbacks]], [[nous-portal]] |
| Bedrock "on-demand throughput isn't supported" | [[aws-bedrock]] |
| Local model too small a context | [[configuring-local-ollama]] |
| Gateway down, hung, disconnecting | [[diagnosing-gateway-problems]], [[managing-gateway-service]] |
| MCP server will not connect | [[testing-mcp-servers]] |
| macOS launchd PATH, WSL2 slowness/clock, Windows editor, NFS SQLite | [[fixing-platform-pitfalls]] |
| macOS computer-use permissions stale | [[cua-driver]] |
| Prompt/skill/memory edits not taking effect | [[session-lifecycle]], [[system-prompt-assembly]] |
| Unexpected cost after switching model or key | [[prompt-caching]] |

## Catalog

### Source
- [[hermes-admin-deep-research]]: provenance, section-to-page map, known conflicts and gaps.

### Strategies (goal, approach, target)
- [[provider-resilience-strategy]]: three failover layers and their cache cost.
- [[secret-isolation-strategy]]: nine layers keeping credentials out of reach.
- [[multi-profile-deployment-strategy]]: many profiles on one host or fleet.

### Skills (procedures)
- [[triaging-hermes-health]]: gate checks, read-only sweep, symptom routing, escalation ladder.
- [[enforcing-zero-process-barrier]]: stop everything and prove it.
- [[resolving-wal-lock-refusals]]: Playbook 1.
- [[repairing-state-db]]: Playbook 2 (FTS vs structural).
- [[clearing-interrupted-turns]]: Playbook 3.
- [[fixing-platform-pitfalls]]: Playbook 4 (NFS, macOS, WSL2, Windows, git packs).
- [[repairing-package-environment]]: `hermes pm` doctor/repair/install.
- [[updating-hermes]]: pre-flight, run, post-flight.
- [[setting-config-values]]: `hermes config` rules and edge cases.
- [[configuring-secret-managers]]: Bitwarden and 1Password.
- [[fixing-terminal-environment]]: `.bashrc` guard and `shell_init_files`.
- [[configuring-local-ollama]]: 64K context recipe.
- [[managing-credential-pools-and-fallbacks]]: `hermes auth` and `hermes fallback`.
- [[importing-from-other-agents]]: Claude Code, Codex, Cursor, OpenClaw.
- [[setting-up-egress-proxy]]: iron-proxy install and verify.
- [[testing-mcp-servers]]: `hermes mcp test` exit codes.
- [[managing-gateway-service]]: install, supervise, park.
- [[diagnosing-gateway-problems]]: heartbeat, watchdog, USR2, exit codes.

### Entities (named things)
- Core: [[hermes-agent]], [[hermes-home]], [[hermes-cli]], [[hermes-doctor]], [[hermes-pm]], [[hermes-update]], [[hermes-gateway]], [[hermes-desktop]], [[hermes-online-docs]]
- Files: [[config-yaml]], [[env-file]], [[auth-json]], [[soul-md]], [[state-db]]
- Subsystems: [[skill-curator]], [[cron-scheduler]], [[iron-proxy]], [[browser-vault]], [[cua-driver]]
- Secret sources: [[bitwarden-secrets-manager]], [[onepassword-cli]]
- Providers: [[nous-portal]], [[aws-bedrock]], [[ollama]]

### Concepts (ideas and mechanisms)
- Safety and config: [[operational-invariants]], [[profile-isolation]], [[config-precedence]], [[secrets-vs-config-split]], [[managed-scope]], [[remote-config-mode]], [[installation-provenance]], [[external-secret-managers]], [[security-settings]], [[backups-and-snapshots]]
- State: [[sqlite-wal-image]], [[session-admission-and-turn-recovery]], [[session-lifecycle]]
- Prompt and memory: [[system-prompt-assembly]], [[context-files]], [[persistent-memory]], [[skills-system]], [[context-compression]], [[prompt-caching]]
- Models: [[provider-resolution]], [[model-configuration]], [[credential-pools]], [[fallback-providers]], [[auxiliary-tasks]], [[agent-and-display-settings]]
- Tools: [[toolsets-and-tool-registry]], [[command-approvals]], [[terminal-backends]], [[delegation]], [[mcp-integration]], [[browser-automation]], [[web-and-media-tools]], [[plugins-and-hooks]], [[checkpoints-and-worktrees]]
- Surfaces: [[hermes-interfaces]], [[profile-multiplexing]]

## Conventions

- **Frontmatter:** `title`, `type` (`entity`, `concept`, `skill`, `strategy`, `source`), `created` (never changed), `updated` (bump on revision), `sources` (source slugs), `related` (slugs).
- **Links:** inline wikilinks such as [[state-db]]. A missing target should be created or retargeted; do not leave dead links.
- **Every page ends with `## Open Questions`.**
- **Provenance labels:** statements without a label come from the source. `Agent note (derived)` marks the ingesting agent's inference; `Agent note (host-specific, not from the source)` marks notes about this Ubuntu 24.04 arm64 machine; `Synthesized procedure` marks an ordering the source does not give.
- **Contradictions** are flagged inline as `> **Contradiction:** ... Resolve by: ...` and never silently overwritten.
- **Method:** distillation per the ingest skill (atoms: entity, concept, skill, strategy); one canonical page per fact, cross-linked elsewhere.
- **Tables:** commands containing `|` are written without pipes inside table cells.

## Open Questions

- Add a `raw/` copy of the source and of `llms.txt` so lint can diff the wiki against upstream ([[hermes-online-docs]])?
- Add `CLAUDE.md` pointers so Claude Code loads [[operational-invariants]] automatically in `/home/ubuntu/hermes-maintenance`?
- Next sources to ingest: real `hermes doctor` / `hermes dump` output from this host as a baseline.
