---
title: hermes doctor
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-cli, enforcing-zero-process-barrier, resolving-wal-lock-refusals, installation-provenance, triaging-hermes-health, hermes-pm, operational-invariants, state-db]
---

# hermes doctor

> The first-line health command. Read-only by default; **`--fix` adds a competing writer** and is only safe with zero Hermes processes running.

## Behaviour

- Detects and reports **installation provenance** ([[installation-provenance]]). Check it before updating or editing application files, because package-owned installs (Desktop bundle, Docker, Nix, Termux) reject source-level git changes.
- When another process still holds a retired WAL log of [[state-db]], it prints `PID N (command)` for each holder and **skips its own health probes** so it does not become another writer. Terminate each listed PID and re-run until no holder lines appear ([[resolving-wal-lock-refusals]]).
- With a named profile: `hermes -p <profile> doctor`.
- `hermes doctor --fix` must never run while Hermes processes run ([[operational-invariants]] rule 2).

## Sibling doctors

| Command | Scope | Page |
|---|---|---|
| `hermes pm doctor` | lockfile vs installed bytes and Python packages | [[hermes-pm]] |
| `hermes cron doctor` | cron jobs and delivery | [[cron-scheduler]] |
| `hermes hooks doctor` | hooks | [[plugins-and-hooks]] |
| `hermes computer-use doctor [--json]` | cua-driver; exit 0/1/2 | [[cua-driver]] |
| `hermes config check` | config validation (then `hermes config migrate`) | [[setting-config-values]] |
| `hermes fallback check [--live] [--json]` | fallback credentials | [[fallback-providers]] |
| `hermes mcp test <server>` | one MCP server; exit 0/1/2/3 | [[testing-mcp-servers]] |

## Where it fits

Step 1 of [[triaging-hermes-health]]; also the "zero holders" gate in [[enforcing-zero-process-barrier]].

## Open Questions

- What exactly does `--fix` change, and does it have a dry-run?
- What other probes does `hermes doctor` run (provider auth, gateway, cron)? The source only mentions provenance and WAL-holder detection.
- Does `hermes doctor` honour `-p` for the holder scan across all profiles, or per profile only?
