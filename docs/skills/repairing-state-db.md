---
title: Repairing state.db
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [state-db, sqlite-wal-image, enforcing-zero-process-barrier, backups-and-snapshots, resolving-wal-lock-refusals, hermes-cli, operational-invariants]
---

# Repairing state.db (Playbook 2)

> Two corruption classes exist ([[state-db]]): **A** derived FTS index (`messages_fts*`) and **B** structural B-tree/freelist (`SQLITE_CORRUPT`, `SQLITE_NOTADB`). The protocol below covers both.

## Symptoms

- Class A: search degrades to `LIKE`, `fts_stale` set in `state_meta`, FTS triggers missing; canonical messages keep saving.
- Class B: `StateDbCorruptError`, writes stop, transcripts spool to `~/.hermes/sessions/<id>.jsonl` and `pending_messages/`.

## Protocol

1. **Zero-process barrier:** stop everything and confirm zero holders via `hermes doctor` ([[enforcing-zero-process-barrier]]).
2. **Read-only inspection:**
   ```bash
   HERMES_HOME="$HOME/.hermes" hermes sessions recover --source "$HOME/.hermes/state.db" --inspect-only
   HERMES_HOME="$HOME/.hermes" hermes sessions repair --check-only
   ```
3. **Guarded repair or recovery:**
   ```bash
   HERMES_HOME="$HOME/.hermes" hermes sessions repair
   ```
   `repair` automatically creates a backup and runs guarded snapshot-and-promotion. If it says structural recovery to a new file is required:
   ```bash
   HERMES_HOME="$HOME/.hermes" hermes sessions recover --source "$HOME/.hermes/state.db" --output "$HOME/recovered-state.db"
   ```
   This copies row-bearing tables and regenerates FTS indexes while excluding runtime ledgers. Alternatively restore from `state-snapshots/` ([[backups-and-snapshots]]).
4. **Verify all four post-repair invariants before restarting the gateway:**
   ```bash
   # 1. Health probe must pass
   HERMES_HOME="$HOME/.hermes" hermes sessions repair --check-only
   # 2. Stale marker check must return no rows
   sqlite3 "$HOME/.hermes/state.db" "SELECT key, value FROM state_meta WHERE key = 'fts_stale';"
   # 3. FTS triggers (messages_fts_delete, messages_fts_insert, messages_fts_update) must be present
   sqlite3 "$HOME/.hermes/state.db" "SELECT type, name FROM sqlite_master WHERE name IN ('messages_fts_insert','messages_fts_update','messages_fts_delete') ORDER BY name;"
   # 4. Canonical row counts must not decrease
   sqlite3 "$HOME/.hermes/state.db" "SELECT 'sessions', COUNT(*) FROM sessions UNION ALL SELECT 'messages', COUNT(*) FROM messages;"
   ```
   Record the row counts **before** step 3 so check 4 is meaningful.

## Do not

- Never restore `state.db.corrupt.<ts>.bak` or `*.malformed-backup` over `state.db`.
- Never copy `state.db` alone or delete sidecars ([[sqlite-wal-image]]).
- Do not run `sessions repair` / `optimize` with any Hermes process alive ([[operational-invariants]]).
- For lock refusals without corruption use [[resolving-wal-lock-refusals]] instead.

## Open Questions

- **Promotion gap:** after `recover --output ~/recovered-state.db` the source does not say how to promote it to `~/.hermes/state.db` (and what to do with the old WAL/SHM). Do not guess; check `hermes sessions recover --help` and [[hermes-online-docs]].
- Does a `sqlite3` read of the live DB (verification queries) risk becoming a competing process? Run them only after processes are stopped and the repair is done.
