---
title: Fixing Platform-Specific Pitfalls
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [sqlite-wal-image, enforcing-zero-process-barrier, hermes-update, managing-gateway-service, mcp-integration, installation-provenance]
---

# Fixing Platform-Specific Pitfalls (Playbook 4)

> Five independent fixes. Each has its own trigger.

## 1. SQLite on network or virtual mounts (NFS, CIFS/SMB, sshfs, Docker Desktop virtiofs/9p)

WAL's `-shm` locking is unsafe there. Fresh DBs auto-start in `delete` mode, but **pre-existing WAL DBs are not live-downgraded**.

1. Stop **all** Hermes processes ([[enforcing-zero-process-barrier]]).
2. `hermes sessions set-journal-mode delete`
3. Set `database.journal_mode: delete` in `~/.hermes/config.yaml`.

([[sqlite-wal-image]])

## 2. macOS launchd gateway missing Homebrew or NVM tools (node, ffmpeg)

launchd inherits a minimal `PATH` (`/usr/bin:/bin:/usr/sbin:/sbin`). From an interactive shell whose `PATH` includes Homebrew/NVM run `hermes gateway install && hermes gateway start`, then verify:

```bash
/usr/libexec/PlistBuddy -c "Print :EnvironmentVariables:PATH" ~/Library/LaunchAgents/ai.hermes.gateway.plist
```

## 3. WSL2

- **Gateway disconnects on Windows idle:** enable systemd in `/etc/wsl.conf` (`[boot]` then `systemd=true`), then `wsl --shutdown` in PowerShell; or run the gateway in tmux: `tmux new -s hermes 'hermes gateway run'`.
- **`git status` or `hermes chat` 10-100x slow:** move repos and `~/.hermes` off the 9P `/mnt/c/...` mount onto native ext4 (`~/...`) and exclude `\\wsl$\...` from Windows Defender.
- **OAuth or TLS fails after laptop sleep:** clock drift; `sudo hwclock -s`.
- **`bad interpreter: /bin/bash^M`:** CRLF line endings; `dos2unix` the script and `git config --global core.autocrlf input`.
- **Chrome bridge:** see the MCP route in [[mcp-integration]].

## 4. Native Windows

- VS Code `/prompt` or `/edit` returns a blank buffer: set `$env:EDITOR = "code --wait"` (`--wait` is mandatory).
- Hermes sets `CP_UTF8` (65001) and `PYTHONUTF8=1` at entry points (opt-out `HERMES_DISABLE_WINDOWS_UTF8=1`). Custom Python scripts opening files should pass `encoding="utf-8"`.

## 5. Abandoned git pack files blocking `hermes update`

After a killed fetch or full disk:

1. Quit Desktop; terminate lingering `git rev-list` / `git maintenance` processes.
2. `rm -f ~/.hermes/hermes-agent/.git/objects/pack/tmp_pack_*`
3. If needed: `git -C ~/.hermes/hermes-agent fetch --refetch --filter=blob:none origin`
4. Re-run `hermes update` ([[hermes-update]]).

Source installs only ([[installation-provenance]]). Gateway service specifics: [[managing-gateway-service]].

## Open Questions

- Linux-native equivalents (e.g. systemd user manager `PATH`, `Environment=` lines for Node/NVM) are not covered by the source.
- Is there a way to verify journal mode (`PRAGMA journal_mode`) read-only before changing it?
