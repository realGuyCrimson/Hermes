---
title: Hermes Gateway
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [state-db, profile-multiplexing, managing-gateway-service, diagnosing-gateway-problems, session-admission-and-turn-recovery, hermes-interfaces, cron-scheduler, enforcing-zero-process-barrier, hermes-cli, env-file, plugins-and-hooks]
---

# Hermes Gateway

> The long-running per-profile process that runs messaging adapters and cron and acts as the **single canonical writer** to [[state-db]] over a local WebSocket (`/api/ws`). One host gateway can multiplex many profiles ([[profile-multiplexing]]).

## Responsibilities

- Owns the session authority for each profile's `state.db` (including `session_admissions` and `gateway_routing`).
- Runs 25+ messaging platform adapters; enforces DM pairing (`pairing/`).
- Serves HTTP listeners (API server, webhooks) when enabled ([[hermes-interfaces]]).
- Runs cron ([[cron-scheduler]]) and loads gateway hooks at startup ([[plugins-and-hooks]]).
- Re-reads `.env` at the start of every turn; no restart needed for secret changes ([[env-file]]).

## Runtime files (in `~/.hermes/`)

| File | Meaning |
|---|---|
| `gateway.pid`, `cron.pid` | process IDs |
| `gateway_state.json` | state, heartbeat `updated_at` (written every 60 s, stale after 120 s), watchdog state (`degraded`, `exit_reason: loop_liveness_watchdog`) |
| `gateway.parked` | profile parking marker (see [[profile-multiplexing]]) |
| `logs/gateway.log`, `logs/gateway_faulthandler.log` | logs and SIGUSR2 thread dumps |

## Config (`gateway.*`, `platforms.*`)

| Key | Default / values |
|---|---|
| `gateway.multiplex_profiles` | `true` (`false` is retired) |
| `gateway.standalone` | `false` (set `true` to force a profile to run as an independent process) |
| `gateway.allow_all_users` | `false` |
| `gateway.unauthorized_dm_behavior` | `pair`, `ignore`, `decline` |
| `gateway.loop_watchdog` | `true` |
| `gateway.loop_watchdog_probe_interval_s` | `30` |
| `gateway.loop_watchdog_max_strikes` | `3` |
| `gateway.systemd_watchdog_seconds` | `0` |
| `gateway.startup_watchdog` | `true` |
| `gateway.startup_watchdog_timeout_seconds` | `300` |
| `gateway.bot_loop_guard.max_hops` | `4` |
| `platforms.<name>.enabled: false` | authoritatively disables that adapter |

## Event-loop liveness watchdog

An out-of-loop thread probes the asyncio loop every 30 s. After 3 missed strikes it dumps all thread stacks, writes `gateway_state: degraded` and `exit_reason: loop_liveness_watchdog` to `gateway_state.json`, and exits with code **75** (EX_TEMPFAIL) so systemd, launchd or s6 restarts it.

**Non-destructive inspection of a hung gateway** (Linux/macOS): `kill -USR2 <gateway_pid>` appends all thread stack traces to `~/.hermes/logs/gateway_faulthandler.log` without interrupting the process.

## Exit codes

`hermes gateway run`: **75** attached to an existing multiplexer under a supervisor (or a watchdog restart); **78** a served secondary profile refused standalone startup. `hermes gateway ensure`: 4, 5, 6, 7 (see [[hermes-cli]]).

## Crash behaviour

If the gateway dies mid-turn, the next owner marks the in-flight turn `unknown` and pauses that session's queue ([[session-admission-and-turn-recovery]], [[clearing-interrupted-turns]]).

## Procedures

[[managing-gateway-service]] (install, start, stop, supervisors), [[diagnosing-gateway-problems]], [[enforcing-zero-process-barrier]].

## Open Questions

- Does `hermes gateway stop` also stop the supervisor unit so it is not immediately restarted?
- What does `hermes gateway ensure` do functionally (it is only described by its exit codes)?
- Which listener settings (host/port keys) configure the API server and webhooks? Only default ports are given ([[hermes-interfaces]]).
