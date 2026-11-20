---
title: SQLite WAL Image
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [state-db, operational-invariants, resolving-wal-lock-refusals, repairing-state-db, fixing-platform-pitfalls, backups-and-snapshots, enforcing-zero-process-barrier]
---

# SQLite WAL Image

> `state.db`, `state.db-wal` and `state.db-shm` form **one atomic image**. Treat them as a unit. This is invariant #1 ([[operational-invariants]]).

## Consequences

- **Never delete `-wal` or `-shm`.** Deleting `-wal` permanently destroys committed turns not yet checkpointed.
- **Never `cp state.db` alone.** The copy is inconsistent. Use `hermes backup` (online `backup()` API) or `hermes sessions recover` ([[backups-and-snapshots]]).
- **Retired WAL guard:** if a process holds an old copy of the WAL while another rewrites the database, every write turn fails with *"another Hermes process still holds an old copy of the session database's write-ahead log, so Hermes stopped writing to keep the file safe ..."*. No data is lost; the refusal is intentional. A forensic `state.db.retired-wal-<ts>-<pid>/` may be captured ([[resolving-wal-lock-refusals]]).
- **Structural corruption** quarantines the handle and disables checkpoint-on-close so damaged pages are not persisted ([[repairing-state-db]]).

## Journal modes

- Default `database.journal_mode: wal`. `delete` is available.
- **Network and virtual mounts** (NFS, CIFS/SMB, sshfs, Docker Desktop virtiofs/9p) make WAL's shared-memory locking (`-shm`) unsafe. Fresh databases auto-start in `delete` mode on detected mounts, but **existing WAL databases are not live-downgraded**. Stop all Hermes processes, run `hermes sessions set-journal-mode delete`, and set `database.journal_mode: delete` ([[fixing-platform-pitfalls]]).
- `database.synchronous: FULL` (macOS refuses lower), `wal_autocheckpoint: 1000`, `journal_size_limit: 67108864` ([[state-db]]).

## Open Questions

- Is `hermes sessions set-journal-mode wal` the reverse operation, and is it advisable?
- Does a retired-WAL holder always imply a stale Hermes process, or can a non-Hermes SQLite client (e.g. `sqlite3` shell) cause it too?
