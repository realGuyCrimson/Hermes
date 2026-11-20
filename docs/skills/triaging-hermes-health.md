---
title: Triaging Hermes Health
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [operational-invariants, hermes-doctor, hermes-cli, enforcing-zero-process-barrier, repairing-package-environment, repairing-state-db, resolving-wal-lock-refusals, diagnosing-gateway-problems, managed-scope, remote-config-mode, setting-config-values, managing-credential-pools-and-fallbacks]
---

# Triaging Hermes Health

> The master "something is wrong" procedure. **Synthesized by the ingesting agent** from the invariants, playbooks and command matrix; the ordering is a recommendation, not a documented upstream flow.

## Step 0: gate checks (before any change)

1. **Which profile?** Default or named; use `-p <name>` throughout ([[profile-isolation]]).
2. **Managed scope?** Look for `/etc/hermes/config.yaml` / `.env` pins ([[managed-scope]]).
3. **Remote config?** `HERMES_CONFIG_BACKEND=remote` in the environment or `.env` ([[remote-config-mode]]).
4. **Wrapper?** Use `~/.local/bin/hermes`, never a venv path ([[hermes-pm]]).
5. **Provenance?** `hermes doctor` reports it; package-owned installs reject git edits ([[installation-provenance]]).

## Step 1: read-only sweep

```bash
hermes doctor                 # no --fix; if it prints "PID N (command)" holder lines, stop here -> resolving-wal-lock-refusals
hermes status --full
hermes dump
hermes config check
hermes pm doctor
hermes pm status
hermes auth list
hermes fallback check
hermes gateway status
hermes cron doctor
hermes hooks doctor
hermes update --check
```

Add as relevant: `hermes mcp test <server>`, `hermes computer-use doctor [--json]`, `hermes sessions repair --check-only`, `hermes sessions recover --source ~/.hermes/state.db --inspect-only`. Logs in `~/.hermes/logs/`: `errors.log` (secrets redacted), `agent.log`, `gateway.log`, `install.log`, `update_receipts/latest.json`.

## Step 2: route by symptom

| Symptom | Go to |
|---|---|
| "another Hermes process still holds an old copy ... write-ahead log" | [[resolving-wal-lock-refusals]] |
| `SQLITE_CORRUPT`, `SQLITE_NOTADB`, `StateDbCorruptError`, `fts_stale` | [[repairing-state-db]] |
| exit code 3 / "Turn lost during restart" | [[clearing-interrupted-turns]] |
| `ModuleNotFoundError`, missing tool, Node/TUI will not start, chromium missing | [[repairing-package-environment]] |
| `hermes update` failing, pack files | [[updating-hermes]], [[fixing-platform-pitfalls]] |
| `node: command not found` or slow terminal commands | [[fixing-terminal-environment]] |
| `config set` refused or setting ignored | [[setting-config-values]], [[managed-scope]], [[remote-config-mode]] |
| 401/429 loops, provider outage | [[managing-credential-pools-and-fallbacks]], [[nous-portal]] |
| Bedrock on-demand throughput error | [[aws-bedrock]] |
| local model errors, tiny context | [[configuring-local-ollama]] |
| gateway down, disconnects, hung | [[diagnosing-gateway-problems]], [[managing-gateway-service]] |
| MCP server fails | [[testing-mcp-servers]] |
| macOS/WSL2/Windows/NFS quirks | [[fixing-platform-pitfalls]] |

## Step 3: escalation ladder (least to most invasive)

1. Config: `hermes config check`, then `hermes config migrate` ([[setting-config-values]]).
2. Environment: `hermes pm doctor`, then `hermes pm repair` ([[repairing-package-environment]]).
3. Providers: `hermes auth refresh|reset`, `hermes fallback check --live` ([[managing-credential-pools-and-fallbacks]]).
4. Gateway: [[diagnosing-gateway-problems]].
5. State: [[enforcing-zero-process-barrier]], then `sessions recover --inspect-only`, `sessions repair --check-only`, only then repair ([[repairing-state-db]]).
6. Last resort: restore from `state-snapshots/` or a `hermes backup` ([[backups-and-snapshots]]).

## Never

[[operational-invariants]]: no `rm -rf ~/.hermes`, no copying/deleting WAL sidecars, no `--fix`/repair/optimize while processes run.

## Open Questions

- Which exact fields does `hermes dump` and `hermes status --full` output? Useful to capture a baseline for diffing.
- Should the sweep be scripted (non-interactive) and its output stored under `logs/` or in the repo for later comparison?
