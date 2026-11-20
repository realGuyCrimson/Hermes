---
title: hermes CLI
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-doctor, hermes-pm, hermes-update, hermes-gateway, config-yaml, profile-isolation, triaging-hermes-health, hermes-interfaces, operational-invariants, state-db]
---

# hermes CLI

> The `hermes` command, installed as a wrapper at `~/.local/bin/hermes` on POSIX source installs. Always call the wrapper (never a hard-coded `venv/bin/hermes`) so the pre-import launcher can validate the PM stamp ([[hermes-pm]]).

## Invocation rules

- Prepend `hermes -p <profile>` for any named profile under `~/.hermes/profiles/<profile>/` ([[profile-isolation]]).
- Modes: `hermes` (classic CLI), `hermes --tui` (Ink TUI), `hermes desktop`, `hermes dashboard` (see [[hermes-interfaces]]).
- Session continuation: `hermes -c` / `--continue` (per-terminal breadcrumbs), `hermes --resume <session_id>` ([[session-lifecycle]]).
- `HERMES_HOME="$HOME/.hermes"` is exported explicitly in the source's `hermes sessions ...` repair recipes ([[repairing-state-db]]).

## Command matrix (section 10 of the source)

The source's table loses its column boundaries because commands contain `|`. The inspect/mutate split below is the ingesting agent's reading, based on each command's semantics and other parts of the source.

| Domain | Inspect (read-only) | Mutate / repair |
|---|---|---|
| System health and triage | `hermes doctor`, `hermes status --full`, `hermes dump`, `hermes config check` | `hermes config migrate` |
| Package manager | `hermes pm doctor`, `hermes pm status` | `hermes pm repair`, `hermes pm install [chromium, cua-driver, --extra X]` |
| Configuration and secrets | `hermes config show`, `hermes config get <KEY> [--json] [--raw]` | `hermes config set <KEY> <VAL>`, `hermes config unset <KEY>` |
| Models, auth, fallbacks | `hermes auth list`, `hermes fallback check [--live] [--json]`, `hermes portal info` | `hermes auth reset <provider>`, `hermes auth refresh <provider>`, `hermes model` |
| Sessions and state.db | `hermes sessions list [--workspace <dir>]`, `hermes sessions recover --source ~/.hermes/state.db --inspect-only`, `hermes sessions repair --check-only` | `hermes sessions repair`, `hermes sessions optimize`, `hermes sessions prune`, `hermes sessions repair-routing [--apply]` |
| Gateway and services | `hermes gateway status [--system]`, `kill -USR2 <pid>` (dumps to `logs/gateway_faulthandler.log`) | `hermes gateway stop [--all]`, `hermes gateway start`, `hermes gateway install [--force]` |
| Cron and emergency stop | `hermes cron doctor`, `hermes cron status`, `hermes cron list` | `hermes pause` (global emergency stop), `hermes resume`, `hermes cron tick` |
| MCP servers and hooks | `hermes mcp test <server>`, `hermes hooks doctor`, `hermes hooks list` | `hermes mcp configure <server>`, `hermes hooks test <event>`, `hermes hooks revoke <cmd>` |
| Skills, bundles, curator | `hermes skills list`, `hermes skills check`, `hermes curator status`, `hermes bundles list` | `hermes skills update`, `hermes skills audit`, `hermes curator run [--dry-run]`, `hermes curator rollback` |
| Checkpoints and worktrees | `hermes checkpoints status`, `hermes worktree list [--json]` | `hermes checkpoints prune`, `hermes worktree prune [--dry-run]`, `hermes worktree restore <name>` |
| Computer use and vault | `hermes computer-use doctor [--json]`, `hermes computer-use permissions status [--json]`, `hermes vault list` | `hermes computer-use install [--upgrade]`, `hermes computer-use permissions grant`, `hermes vault key migrate --to keychain` or `--to file` |
| Backups and updates | `hermes update --check`, `hermes update --plan` | `hermes backup [--quick] [-o <path>]`, `hermes import <zip>`, `hermes update [--backup] [--yes]` |

Mutating commands that are **unsafe while Hermes processes run**: `hermes doctor --fix`, `hermes sessions repair`, `hermes sessions optimize` ([[enforcing-zero-process-barrier]]).

## Other command families (documented on topic pages)

| Family | Page |
|---|---|
| `hermes config show/path/env-path/get/set/unset/check/migrate` | [[setting-config-values]] |
| `hermes auth add/list/priority/remove/reset/refresh`, `hermes fallback add/list/remove/clear/check` | [[managing-credential-pools-and-fallbacks]] |
| `hermes setup --portal`, `hermes portal info/tools`, `hermes auth add nous` | [[nous-portal]] |
| `hermes secrets bitwarden ...`, `hermes secrets onepassword setup --token <token>` | [[configuring-secret-managers]] |
| `hermes egress install/setup/start/status/reload` | [[setting-up-egress-proxy]] |
| `hermes mcp`, `hermes mcp catalog/install/add/configure/login/test` | [[mcp-integration]], [[testing-mcp-servers]] |
| `hermes skills ...`, `hermes curator ...`, `hermes bundles ...` | [[skills-system]], [[skill-curator]] |
| `hermes memory setup/status/off` | [[persistent-memory]] |
| `hermes import-agent <source>`, `hermes claw migrate` | [[importing-from-other-agents]] |
| `hermes approvals suggest [--apply 1,3]` | [[command-approvals]] |
| `hermes vault list/add/rm/sources/key` | [[browser-vault]] |
| `hermes computer-use ...` | [[cua-driver]] |
| `hermes gateway install/start/stop/ensure/run/status` | [[managing-gateway-service]], [[hermes-gateway]] |
| `hermes dashboard --stop`, `hermes proxy start` | [[hermes-interfaces]] |
| `hermes sessions refresh-prompts/set-journal-mode` | [[session-lifecycle]], [[sqlite-wal-image]] |
| `hermes update ...` | [[hermes-update]], [[updating-hermes]] |
| `hermes pm ...` | [[hermes-pm]] |
| `hermes backup`, `hermes import` | [[backups-and-snapshots]] |
| `hermes checkpoints`, `hermes worktree` | [[checkpoints-and-worktrees]] |
| `hermes plugins`, `hermes hooks` | [[plugins-and-hooks]] |

## Exit codes

| Command | Code | Meaning |
|---|---|---|
| `hermes chat` | 1 | Session not found on `--resume` / `-c` |
| `hermes chat` | 2 | Unsupported in-process flag passed to a gateway client |
| `hermes chat` | 3 | Lost turn owner (unknown admission state) while a finite query was queued ([[clearing-interrupted-turns]]) |
| `hermes gateway ensure` | 4 | Authorization or profile mismatch |
| `hermes gateway ensure` | 5 | Startup deadline reached (still pending) |
| `hermes gateway ensure` | 6 | Runtime draining or update in progress |
| `hermes gateway ensure` | 7 | Inaccessible runtime, conflicting supervisor, or startup failure |
| `hermes gateway run` | 75 (EX_TEMPFAIL) | Attached to an existing multiplexer under a supervisor, or a watchdog restart |
| `hermes gateway run` | 78 | A served secondary profile refused standalone startup |
| `hermes mcp test <server>` | 0 / 1 / 2 / 3 | Connected and listed tools / connection failed / argparse usage error / server not in config |
| `hermes computer-use doctor` | 0 / 1 / 2 | OK / degraded or failed (prints fix hints) / binary unreachable |
| `hermes update` | 0 | Success, including post-commit-point follow-up failures; non-zero only if code was rolled back |
| `hermes update` (Docker) | 2 | Not supported; pull and recreate the container instead |
| `hermes fallback check --live --json` | 1 | At least one fallback entry failed |

## Open Questions

- Full flag lists are not in the source; use `hermes <cmd> --help` and [[hermes-online-docs]] (`llms-full.txt`) when a flag is not listed here.
- Which `hermes sessions` subcommands are read-only beyond `list`, `recover --inspect-only`, `repair --check-only`?
- `hermes gateway ensure` and `hermes gateway run` are named only in the exit-code list; their intended use is not described.
