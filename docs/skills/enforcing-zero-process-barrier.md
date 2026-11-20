---
title: Enforcing the Zero-Process Barrier
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [operational-invariants, hermes-doctor, resolving-wal-lock-refusals, repairing-state-db, hermes-gateway, hermes-desktop, sqlite-wal-image, fixing-platform-pitfalls]
---

# Enforcing the Zero-Process Barrier

> The precondition for any state repair: **no Hermes process may be running on the profile**, verified by `hermes doctor` reporting zero holder PIDs. Used by [[resolving-wal-lock-refusals]], [[repairing-state-db]] and journal-mode changes ([[fixing-platform-pitfalls]]).

## Steps

1. **Stop the gateway:** `hermes gateway stop` (add `-p <profile>` for a named profile; `--all` exists; [[hermes-gateway]]).
2. **Stop the dashboard:** `hermes dashboard --stop`.
3. **Quit Hermes Desktop completely** from its menu ([[hermes-desktop]]).
4. **Stop custom wrappers:** any cron or service wrappers you run around Hermes.
5. **Audit with read-only `hermes doctor`** (no `--fix`; `hermes -p <profile> doctor` for named profiles). If it prints `PID N (command)` holder lines it also skips its own health probes.
6. **Terminate each listed PID** (those PIDs only; never `pkill python`) and re-run `hermes doctor` until **zero holder lines** appear.
7. Proceed with the repair. Afterwards **start a single owner first**: `hermes gateway start`, or open Desktop, then resume.

## Why

A process that holds a retired WAL or an active lock turns `--fix`, `sessions repair` and `sessions optimize` into a competing writer ([[sqlite-wal-image]], [[operational-invariants]] rule 2).

## Gotchas

- Parked profiles still need a check: parking pauses adapters and cron but whether a holder remains is not specified ([[profile-multiplexing]]).
- A supervisor (systemd, launchd) may restart the gateway after you stop it; confirm it stays down before repairing ([[managing-gateway-service]]).

## Open Questions

- Does `hermes gateway stop` disable the systemd unit's `Restart=` behaviour, or must the unit be stopped with `systemctl --user stop hermes-gateway`?
- Does `hermes gateway stop --all` also stop every profile's standalone daemon?
