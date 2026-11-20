---
title: state.db (SessionDB)
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [sqlite-wal-image, session-lifecycle, session-admission-and-turn-recovery, repairing-state-db, resolving-wal-lock-refusals, backups-and-snapshots, hermes-gateway, operational-invariants, enforcing-zero-process-barrier, fixing-platform-pitfalls]
---

# state.db (SessionDB)

> The SQLite database in `~/.hermes/` (per profile) that stores every session and message. Written by the [[hermes-gateway]] (the session authority). Three files form one image: `state.db`, `state.db-wal`, `state.db-shm` ([[sqlite-wal-image]]).

## Contents

- Tables named in the source: `sessions`, `messages`, `messages_fts` (FTS5), `messages_fts_trigram`, `gateway_routing`, `session_admissions`, `worker_executions`, `schema_version` (currently **v31**), `state_meta` (holds `fts_stale`).
- FTS sync triggers: `messages_fts_insert`, `messages_fts_update`, `messages_fts_delete`.
- WAL mode by default. `hermes backup` uses SQLite's online `backup()` API ([[backups-and-snapshots]]).

## Config (`database.*`, `runtime.*`)

| Key | Default / notes |
|---|---|
| `database.journal_mode` | `wal` or `delete`; fresh DBs auto-use `delete` on NFS, SMB, sshfs, virtiofs, 9p |
| `database.synchronous` | `FULL`; macOS refuses lower |
| `database.wal_autocheckpoint` | `1000` |
| `database.journal_size_limit` | `67108864` |
| `runtime.nofile_soft_limit` | `4096` |
| `runtime.malloc_arena_max` | `4` on glibc Linux |

Retention and pruning (`sessions.*`) are in [[session-lifecycle]].

## Sidecar artifacts

| Artifact | Meaning | Rule |
|---|---|---|
| `state.db.retired-wal-<ts>-<pid>/` (+ `manifest.json`) | retired WAL captured when a process held an old log during a write refusal | keep for forensics |
| `state.db.pre-update-emergency-<ts>.bak` | Desktop updater snapshot ([[hermes-desktop]]) | inspect with `hermes sessions recover --source <file> --inspect-only` |
| `state.db.corrupt.<ts>.bak`, `*.malformed-backup` | quarantined damaged DBs | **never restore over `state.db`** |
| `state-snapshots/` | quick snapshots incl. `state.db` | restore path for repair |
| `sessions/<id>.jsonl`, `pending_messages/` | transcript spool while the DB handle is quarantined | |

## Two corruption classes

- **Class A, derived FTS index (`messages_fts*`):** SessionDB sets `fts_stale` in `state_meta`, drops the FTS sync triggers in the same transaction, keeps saving canonical messages, and falls back to `LIKE` search until a guarded rebuild.
- **Class B, structural (`SQLITE_CORRUPT`, `SQLITE_NOTADB`):** SessionDB **quarantines the handle** (`StateDbCorruptError`), stops writes, disables WAL checkpoint on close (`SQLITE_DBCONFIG_NO_CKPT_ON_CLOSE`, Python 3.12+) so damaged pages are not written, and spools transcripts.

Procedures: [[resolving-wal-lock-refusals]] (old-WAL holder), [[repairing-state-db]] (Class A/B), [[clearing-interrupted-turns]] (unknown turns), [[fixing-platform-pitfalls]] (network mounts).

## Commands

`hermes sessions list [--workspace <dir>]`, `recover --source <file> [--inspect-only] [--output <file>]`, `repair [--check-only]`, `optimize`, `prune`, `repair-routing [--apply]`, `refresh-prompts`, `set-journal-mode delete`.

## Open Questions

- Is there a documented schema reference (columns), or only the table names above?
- How are `state.db` files laid out for named profiles ([[profile-isolation]])? Each profile has its own `state.db`, but the session authority is per profile inside a multiplexed gateway ([[profile-multiplexing]]).
- What does `hermes sessions optimize` actually do (VACUUM, FTS optimize)? Not specified.
