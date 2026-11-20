---
title: Session Lifecycle and Retention
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [state-db, soul-md, persistent-memory, session-admission-and-turn-recovery, hermes-cli, system-prompt-assembly, enforcing-zero-process-barrier]
---

# Session Lifecycle and Retention

> How sessions start, resume, rotate, and get pruned.

## Start, resume, rotate

- `/new` (and `/reset` on messaging) starts a fresh session; this is also how frozen prompt content (memory, SOUL.md) refreshes ([[system-prompt-assembly]]).
- `hermes sessions refresh-prompts` refreshes the stored prompt for existing sessions ([[soul-md]], [[persistent-memory]]).
- `hermes -c` / `--continue` resumes the last session for this terminal using breadcrumb files in `~/.hermes/terminal-sessions/` (30 days). `session.terminal_continue: true` is the default.
- `hermes --resume <session_id>`; exit code 1 if the session is not found.
- `hermes sessions list [--workspace <dir>]`.

## Retention config (`sessions.*`)

| Key | Default / notes |
|---|---|
| `sessions.auto_prune` | `true`; prunes **ended** sessions only |
| `sessions.retention_days` | `90` |
| `sessions.vacuum_after_prune` | `true`; runs if >30 days and >25% freelist pages |
| `sessions.min_vacuum_interval_days` | `30` |
| `sessions.min_interval_hours` | `24` |
| `session.terminal_continue` | `true` |
| `group_sessions_per_user` | `true` |
| `thread_sessions_per_user` | `false` |

Manual: `hermes sessions prune`, `hermes sessions optimize` (the latter is unsafe while processes run; [[enforcing-zero-process-barrier]]).

## Crash behaviour

See [[session-admission-and-turn-recovery]].

## Open Questions

- Does `hermes sessions prune` apply the same age rule as auto-prune?
- What distinguishes a "group" session from a "thread" session on a messaging platform (the source gives only the two flags)?
