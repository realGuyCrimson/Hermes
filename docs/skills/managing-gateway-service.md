---
title: Managing the Gateway Service
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-gateway, profile-multiplexing, diagnosing-gateway-problems, fixing-platform-pitfalls, enforcing-zero-process-barrier, hermes-update, installation-provenance]
---

# Managing the Gateway Service

> Install and supervise the [[hermes-gateway]] as an OS service.

## Install

`hermes gateway install [--force]` registers a **user** service:

| OS | Unit |
|---|---|
| Linux | `~/.config/systemd/user/hermes-gateway.service` |
| macOS | `~/Library/LaunchAgents/ai.hermes.gateway.plist` |
| Windows | `Hermes_Gateway` Scheduled Task, or `Startup\Hermes_Gateway.vbs` running `pythonw.exe` |

- **Linux servers:** run `sudo loginctl enable-linger <USER>` so user services survive logout; or `sudo hermes gateway install --system` for a system unit.
- **macOS:** install from an interactive shell whose `PATH` includes Homebrew/NVM ([[fixing-platform-pitfalls]]).
- **WSL2:** enable systemd in `/etc/wsl.conf` or run `tmux new -s hermes 'hermes gateway run'`.

> **Agent note (host-specific, not from the source):** this is a headless Ubuntu server; `loginctl enable-linger ubuntu` is the relevant step. Not verified whether it is already enabled.

## Operate

```bash
hermes gateway status [--system]
hermes gateway start
hermes gateway stop [--all]
hermes -p <name> gateway stop      # parks that profile only (gateway.parked)
hermes -p <name> gateway start     # unparks; host rescans profiles/ every 30 s
hermes update --plan               # service restart plan across all profiles (read-only)
```

Stopping before repairs: [[enforcing-zero-process-barrier]]. Multiplexing and parking: [[profile-multiplexing]]. Watchdog restarts (exit 75) rely on the supervisor ([[hermes-gateway]]). Config: `gateway.systemd_watchdog_seconds` (0 = off).

## Scripting with exit codes

`hermes gateway ensure`: 4 authorization/profile mismatch, 5 startup deadline reached, 6 runtime draining or update in progress, 7 inaccessible runtime/conflicting supervisor/startup failure. `hermes gateway run`: 75 attached to existing multiplexer or watchdog restart, 78 secondary profile refused standalone startup. Troubleshooting: [[diagnosing-gateway-problems]].

## Open Questions

- Is `hermes gateway install` idempotent after a Python/PM generation change (does the unit reference the wrapper or a venv path)?
- What does `--system` need from `HERMES_HOME` ownership (which user runs the unit)?
