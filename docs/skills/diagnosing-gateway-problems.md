---
title: Diagnosing Gateway Problems
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-gateway, managing-gateway-service, profile-multiplexing, session-admission-and-turn-recovery, clearing-interrupted-turns, resolving-wal-lock-refusals, hermes-cli]
---

# Diagnosing Gateway Problems

> **Synthesized checklist** built from documented gateway facts ([[hermes-gateway]]). Read-only first.

## 1. Is it alive?

- `hermes gateway status [--system]`.
- `~/.hermes/gateway_state.json`: `updated_at` heartbeat (written every 60 s; **stale after 120 s**); `gateway_state: degraded` with `exit_reason: loop_liveness_watchdog` means the watchdog killed it.
- `~/.hermes/gateway.pid`, `cron.pid`; `~/.hermes/profiles/<name>/gateway.parked` (a **parked** profile is intentionally paused; [[profile-multiplexing]]).

## 2. Hung but running

`kill -USR2 <gateway_pid>` appends all thread stack traces to `~/.hermes/logs/gateway_faulthandler.log` **without interrupting** the process (Linux/macOS). The loop watchdog probes every 30 s; 3 strikes dump stacks and exit **75** so the supervisor restarts it.

## 3. Logs

`~/.hermes/logs/gateway.log`, `errors.log` (redacted), `agent.log`.

## 4. Startup refusals and conflicts

- On startup the multiplexer checks for a secondary profile's running standalone daemon, a **duplicate bot token**, or a **port conflict** ([[profile-multiplexing]]).
- `hermes gateway run` exit **78**: a served secondary profile refused standalone startup. Exit **75** under a supervisor: attached to an existing multiplexer.
- `hermes gateway ensure` exit codes 4/5/6/7 ([[managing-gateway-service]]).
- Startup watchdog: `gateway.startup_watchdog` true, timeout 300 s.

## 5. After a crash

Paused sessions and exit code 3: [[clearing-interrupted-turns]], [[session-admission-and-turn-recovery]]. Writes refused because of an old WAL holder: [[resolving-wal-lock-refusals]]. Messaging routes wrong: `hermes sessions repair-routing [--apply]` ([[state-db]]).

## 6. Messaging adapters

Adapter disabled? `platforms.<name>.enabled: false` disables authoritatively. Unauthorized DM behaviour: `gateway.unauthorized_dm_behavior` (`pair`, `ignore`, `decline`); `gateway.allow_all_users` false.

## Open Questions

- Where does the loop-watchdog's thread dump go on Windows (no SIGUSR2)?
- Is there a supported way to read `gateway_state.json` fields (schema) beyond `gateway_state`, `exit_reason`, `updated_at`?
