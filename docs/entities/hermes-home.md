---
title: HERMES_HOME (~/.hermes)
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-agent, profile-isolation, state-db, config-yaml, env-file, auth-json, soul-md, backups-and-snapshots, hermes-pm, installation-provenance, sqlite-wal-image, operational-invariants]
---

# HERMES_HOME (`~/.hermes`)

> The directory that holds all Hermes state for one profile root: config, secrets, sessions, memory, skills, logs, caches, and (for source installs) the code and Python environments. On this machine `../.hermes` from a sibling folder is `~/.hermes`.

## How the path is resolved

Paths are resolved by `get_hermes_home()` in `hermes_constants.py` (used by 119+ modules), never hard-coded. Priority:

1. **Context-local override**: `--profile <name>` / `-p <name>`, applied by `_apply_profile_override()` during CLI bootstrap before other modules import.
2. **`HERMES_HOME` environment variable.**
3. **Platform default**: `~/.hermes` on Linux, macOS, WSL2, Termux; `%LOCALAPPDATA%\hermes` on native Windows; `/opt/data` inside the official Docker container.

See [[profile-isolation]] for why forgetting `-p` is dangerous.

## Working from relative paths

- From a sibling directory (`../.hermes`) or from inside the checkout (`~/.hermes/hermes-agent/`, where `..` is `~/.hermes`) you can read and edit files by relative path.
- **Run CLI diagnostics through `~/.local/bin/hermes`** (or export `HERMES_HOME` explicitly) so the pre-import launcher validates the Package Manager stamp ([[hermes-pm]]).

## Symlinks and external volumes

`HERMES_HOME` itself, or `hooks`, `skills`, `sessions`, `logs`, may be symlinked to external/NAS storage. Existing symlinks and permissions are preserved. If a symlink target is missing, unmounted or not a directory, Hermes **halts initialization with a storage error** rather than replacing the link or creating a local target. (SQLite over network mounts is a separate hazard: see [[sqlite-wal-image]].)

## File and directory map

### Configuration and secrets

| Path | Writer | Purpose and rules |
|---|---|---|
| `config.yaml` | user, CLI, admin | Non-secret config; supports `${VAR}` / `${env:VAR}`. See [[config-yaml]]. |
| `backups/config/` | Hermes config writer | Auto backups `config.yaml.<reason>.<timestamp>`, newest 5 per reason. A malformed `config.yaml` falls back to the newest valid backup with a warning. |
| `.env` | user, CLI, admin | Secrets and bot tokens (UPPER_SNAKE). Gateways re-read it **every turn**; CLI/TUI need `/reload` or restart. See [[env-file]]. |
| `.op.env` | user, admin | Optional, gitignored, mode 0600; holds `OP_SERVICE_ACCOUNT_TOKEN`; loaded after `.env`. See [[onepassword-cli]]. |
| `auth.json` | `hermes auth`, OAuth | OAuth refresh/access tokens and `credential_pool`; cross-process file locking; shared across profiles unless `--isolated-auth`. See [[auth-json]]. |
| `SOUL.md` | user (seeded once) | Agent identity, injected verbatim into system-prompt slot #1; never overwritten by updates. See [[soul-md]]. |
| `BOOT.md` | user, admin | Natural-language startup checklist run as a background one-shot agent turn on `gateway:startup` when the `boot-md` gateway hook is active. See [[plugins-and-hooks]]. |

### State and sessions

| Path | Writer | Purpose and rules |
|---|---|---|
| `state.db`, `state.db-wal`, `state.db-shm` | gateway (SessionDB) | One atomic WAL-mode SQLite image. **Never copy or delete sidecars.** See [[state-db]], [[sqlite-wal-image]]. |
| `state.db.retired-wal-<ts>-<pid>/` | SessionDB guard | Forensic capture (with `manifest.json`) of a retired WAL held by a process during a write refusal. Keep for forensics. |
| `state.db.pre-update-emergency-<ts>.bak` | Desktop updater | Emergency snapshot before a Desktop update modifies `state.db`. Inspect with `hermes sessions recover --source <file> --inspect-only`. |
| `state.db.corrupt.<ts>.bak`, `*.malformed-backup` | SessionDB quarantine | Quarantined damaged copies. **Never restore over `state.db`.** |
| `state-snapshots/` | `hermes update`, `hermes backup` | Quick snapshots (pairing, cron jobs, `config.yaml`, `.env`, `auth.json`, `state.db`). See [[backups-and-snapshots]]. |
| `sessions/<id>.jsonl`, `pending_messages/` | SessionDB | Spool for pending transcripts when the DB handle is quarantined ([[repairing-state-db]]). Named in the repair playbook, not in the source's map table. |
| `terminal-sessions/` | CLI | 30-day per-terminal breadcrumb files used by bare `hermes -c` / `--continue` ([[session-lifecycle]]). |

### Memory, skills and extensions

| Path | Writer | Purpose and rules |
|---|---|---|
| `memories/MEMORY.md` | agent memory tool | Agent notes. Hard cap **2,200 chars**. Entries delimited by `§`. Frozen snapshot at session start. See [[persistent-memory]]. |
| `memories/USER.md` | agent memory tool | User profile. Hard cap **1,375 chars**. Frozen at session start. |
| `skills/` | user, agent, hub | Source of truth for SKILL.md documents; may hold `.no-bundled-skills` marker and `.hub/` metadata. See [[skills-system]]. |
| `skill-bundles/` | `hermes bundles` | `<slug>.yaml` files grouping skills under one `/<bundle-name>` slash command. |
| `pending/skills/` | `skill_manage` | Staged agent-created skills awaiting review when `skills.write_approval: true`. |
| `plugins/`, `plugin-data/` | `hermes plugins` | User plugins (`plugin.yaml` + `__init__.py`, or portable `plugin.json`), `model-providers/`, durable per-plugin storage. See [[plugins-and-hooks]]. |
| `hooks/<name>/` | user, admin | Gateway event hooks (`HOOK.yaml` + `handler.py`); trusted by directory placement; loaded at gateway start. |
| `shell-hooks-allowlist.json` | `hermes hooks` | Approved exact command strings for shell hooks defined in `config.yaml`. |

### Scheduling, gateway and connections

| Path | Writer | Purpose and rules |
|---|---|---|
| `cron/` | cron scheduler | `jobs.json` (atomic rename writes), `deliveries.db` (durable outbound delivery queue), `output/`. See [[cron-scheduler]]. |
| `pairing/` | gateway | DM pairing files `{platform}-pending.json`, `{platform}-approved.json`, `_rate_limits.json`, mode 0600. |
| `gateway_state.json`, `gateway.pid`, `cron.pid`, `gateway.parked` | gateway runner | PID, heartbeat `updated_at` (every 60 s, stale after 120 s), watchdog state, parked-profile marker. See [[hermes-gateway]]. |
| `gateway-connections.json`, `gateway-connection-tokens.json` | Desktop, webapp | Machine-level registry of local, remote HTTP, SSH and Hermes Cloud gateway connections (0600). |
| `webapp/` | webapp server | `session-token`, macOS one-use auth links, `sign-in-registration.json`. |

### Credential and security stores

| Path | Writer | Purpose and rules |
|---|---|---|
| `vault/` | browser vault, CLI | `vault.json.enc`, `vault.key` (0600, 256-bit), `vault.keyref` (OS keychain reference). See [[browser-vault]]. |
| `mcp-tokens/`, `mcp_event_subscriptions.json` | MCP client | OAuth 2.1 tokens per remote server (`<server>.json`, 0600) and webhook `whsec_` secrets. See [[mcp-integration]]. |
| `bws_cache.json`, `bws_cache.enc.json`, `op_cache.json` | secret sources | Disk caches (0600) for Bitwarden (plain or AES-GCM) and 1Password. See [[external-secret-managers]]. |
| `proxy/` | `hermes egress` | `proxy.yaml`, `iron-proxy.log`. See [[iron-proxy]]. |
| `browser-profile/<browser>/` | browser launcher | Managed snapshot of your real browser profile (Cookies, Login Data) when `browser.use_real_profile: true`. See [[browser-automation]]. |
| `cua-manifest.yaml` | admin | Default `computer_use.capability_manifest` path. See [[cua-driver]]. |

### Workspace tooling

| Path | Writer | Purpose and rules |
|---|---|---|
| `checkpoints/` | checkpoint manager | `store/` (shared bare Git repo for `/rollback`, refs `refs/hermes/<hash>`, `indexes/<hash>`, `projects/<hash>.json`), `.last_prune`, `.checkpoints.lock`, `legacy-<ts>/`. See [[checkpoints-and-worktrees]]. |
| `worktree_repos.json` | worktree manager | Repos with Hermes-managed `.worktrees/`, for the 6-hour stale sweep. |
| `import-sync.json` | `hermes import-agent` | Per-profile manifest of file digests for idempotent `--sync`. See [[importing-from-other-agents]]. |
| `context_length_cache.yaml` | model metadata | Provider-confirmed context limits (`bedrock_confirmed_v1`, probed) across restarts. See [[model-configuration]]. |
| `sandboxes/docker/<task_id>/` | Docker backend | Persistent workspace bind mounts. See [[terminal-backends]]. |

### Caches and logs

| Path | Purpose and rules |
|---|---|
| `cache/` | `images/`, `documents/native-inputs/`, `image_token_costs.json`, `delegation/live/<id>/task-<n>.log` (live subagent logs), `exec/` (>50 KB `execute_code` outputs), `terminal/`, `scratch/` (auto-pruned after 24 h idle), `piper-voices/`, `partials/` (resumable downloads). |
| `logs/` | `install.log`, `agent.log`, `gateway.log`, `errors.log` (secrets auto-redacted), `gateway_faulthandler.log` (SIGUSR2 thread dumps), `scratch-prune.log`, `process-results/` (64 receipts kept 7 days), `update_receipts/` (`latest.json`). |

### Code, installs and profiles

| Path | Purpose and rules |
|---|---|
| `profiles/<name>/` | Isolated home for a named profile. Recognized only if it holds at least one identity file: `config.yaml`, `.env`, `SOUL.md`, `profile.yaml`, `auth.json` or `state.db`. See [[profile-isolation]]. |
| `hermes-agent/`, `tools/`, `installs/` | Machine-scoped source checkout, managed binaries plus `facts.json`, and per-install Python 3.14 environment generations. See [[hermes-pm]]. |

## Agent rules

- Treat the whole tree as live. Read freely; mutate only after [[operational-invariants]].
- Never `rm -rf ~/.hermes` to "fix" something.
- Prefer CLI subcommands over hand edits for `config.yaml`, `.env`, `skills/`, and anything in `vault/`.
- Container-owned files in bind mounts can be root-owned; Hermes prints the exact `sudo rm -rf` remediation rather than deleting them itself ([[terminal-backends]]).

## Open Questions

- The map lists modes for some files (0600) but not for directories or the rest; what are the expected owner/mode bits for a healthy install?
- `sessions/` and `pending_messages/` are referenced by the repair playbook but absent from the source's map; are they under `HERMES_HOME` directly or per profile?
- How does the layout differ inside a profile (`profiles/<name>/`) beyond the identity files? The source lists `memories/`, `skills/`, `cron/` per profile but no full map.
