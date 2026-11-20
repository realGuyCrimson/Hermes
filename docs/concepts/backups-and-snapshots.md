---
title: Backups and Snapshots
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [sqlite-wal-image, hermes-update, state-db, config-yaml, remote-config-mode, skill-curator, repairing-state-db, checkpoints-and-worktrees, hermes-home]
---

# Backups and Snapshots

> Hermes has several overlapping safety nets. Use the right one; never improvise a file copy of the database ([[sqlite-wal-image]]).

| Mechanism | What | Where / how |
|---|---|---|
| `hermes backup [--quick] [-o <path>]` | full or quick backup of `HERMES_HOME` | uses SQLite's online `backup()` API; refused in [[remote-config-mode]] |
| `hermes import <zip>` | restore from a backup zip | refused in remote mode |
| `state-snapshots/` | quick snapshots of pairing, cron jobs, `config.yaml`, `.env`, `auth.json`, `state.db` | taken before updates or by `hermes backup --quick`; repair restore source |
| `backups/config/` | automatic `config.yaml.<reason>.<timestamp>` | newest 5 per reason; auto-fallback on malformed config |
| `hermes update` flags | `--backup` (full `.zip`), `--no-backup` | config: `updates.pre_update_backup` (`quick`, `full`, `off`), `backup_keep` (5) ([[hermes-update]]) |
| Update recovery bundle | recovery/lock/custody modules | `<git dir>/hermes-update-recovery/<pre-sha>/` with MANIFEST |
| Desktop emergency snapshot | `state.db.pre-update-emergency-<ts>.bak` | inspect with `hermes sessions recover --source <file> --inspect-only` |
| Quarantine copies | `state.db.corrupt.<ts>.bak`, `*.malformed-backup` | **never restore over `state.db`** |
| Retired WAL capture | `state.db.retired-wal-<ts>-<pid>/` | forensics only |
| Curator backups | `.tar.gz` before consolidating skills | [[skill-curator]] |
| Checkpoints | `/rollback` Git store | [[checkpoints-and-worktrees]] |
| `hermes skills snapshot` | skill state snapshot | [[skills-system]] |
| `hermes sessions recover --output <file>` | structural recovery into a new DB | [[repairing-state-db]] |

## Rules

- Back up before any repair; use `hermes backup`, not `cp state.db`.
- Remember `.env`, `auth.json`, `vault/` (and its key) are sensitive; store backups accordingly ([[browser-vault]]).

## Open Questions

- Does `hermes backup` include `vault/`, `mcp-tokens/` and `memories/`? Not specified.
- Retention for manual backups: none stated.
