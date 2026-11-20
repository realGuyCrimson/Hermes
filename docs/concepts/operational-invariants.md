---
title: Operational Invariants
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [sqlite-wal-image, enforcing-zero-process-barrier, secrets-vs-config-split, hermes-pm, repairing-package-environment, profile-isolation, managed-scope, remote-config-mode, hermes-doctor, state-db]
---

# Operational Invariants

> Seven rules an admin agent must enforce before **any** mutation in `~/.hermes`. They exist because [[hermes-home]] is a live, multi-process state root, not a static config folder. The [[hermes-gateway]] is the canonical writer of [[state-db]], so repairs from the filesystem must coordinate with running processes.

## The seven rules

1. **Never delete `state.db-wal` or `state.db-shm`, and never copy `state.db` alone.** The three files are one atomic SQLite WAL image. Deleting `-wal` destroys committed turns not yet checkpointed. `cp state.db` alone produces a corrupted copy. Use `hermes backup` (SQLite online `backup()` API) or `hermes sessions recover`. See [[sqlite-wal-image]], [[backups-and-snapshots]].
2. **Never run `hermes doctor --fix`, `hermes sessions repair`, or `hermes sessions optimize` while any Hermes process runs.** A process holding a retired WAL or an active lock turns the repair into a competing writer. Stop everything, run read-only `hermes doctor` until zero holder PIDs appear, then repair. See [[enforcing-zero-process-barrier]], [[hermes-doctor]].
3. **Secrets in `.env`, behaviour in `config.yaml`.** UPPER_SNAKE secrets go to `~/.hermes/.env`; dotted keys go to `~/.hermes/config.yaml`. Inside `config.yaml` reference env vars as `${VAR_NAME}` or `${env:VAR_NAME}`; a bare `$VAR` is **never** expanded. See [[secrets-vs-config-split]], [[env-file]], [[config-yaml]].
4. **Never substitute the Python interpreter or call system pip/uv.** Hermes needs **Python 3.14** provisioned by its own Package Manager and its own verified uv pin (any uv on `PATH` is ignored). Always call the wrapper `~/.local/bin/hermes`, never a hard-coded `venv/bin/hermes`. See [[hermes-pm]].
5. **Never delete `~/.hermes` to fix a broken install.** Repair in place: `hermes pm doctor`, `hermes pm repair`, or `cd ~/.hermes/hermes-agent && python -c "import pm; pm.sync_venv(['<extra>'], explicit=True)"`. See [[repairing-package-environment]].
6. **Preserve profile isolation.** Every command or subprocess aimed at a non-default profile must pass `-p <name>` (or set `HERMES_HOME=~/.hermes/profiles/<name>`), otherwise it silently falls back to the default root. See [[profile-isolation]].
7. **Check Managed Scope and Remote Config first.** Keys pinned in `/etc/hermes/config.yaml` or `/etc/hermes/.env` override user files and shell variables and make `hermes config set` fail. With `HERMES_CONFIG_BACKEND=remote`, local `config.yaml` is neither read nor written and file-based commands are refused. See [[managed-scope]], [[remote-config-mode]].

> **Contradiction (within the source):** rule 4 says never substitute the interpreter, but rule 5's fallback recipe uses a bare `python`. See the tension note in [[hermes-pm]]. Resolve by: preferring `hermes pm repair` / `hermes pm install --extra <NAME>` and using the `python -c` form only if the wrapper cannot start, with the PM-managed interpreter.

## Related hard stops found elsewhere in the source

- Never restore `state.db.corrupt.<ts>.bak` or `*.malformed-backup` over `state.db` ([[state-db]]).
- Keep `state.db.retired-wal-<ts>-<pid>/` folders for forensics.
- The **Hardline Blocklist** cannot be bypassed by `--yolo`, `/yolo` or `approvals.mode: off`; it includes killing the supervised gateway's own Python (`pkill -9 python3`, `killall python`). See [[command-approvals]].
- Kill only the PIDs `hermes doctor` lists, not "all python".
- Do not hand-edit around a failing `hermes config set` on a managed key; the pin will still win ([[managed-scope]]).

## How the rules are checked in practice

1. Resolve the profile and `HERMES_HOME` ([[hermes-home]]).
2. Rule out managed or remote config ([[triaging-hermes-health]] step 0).
3. For anything touching state: [[enforcing-zero-process-barrier]].
4. For anything touching Python or tools: go through [[hermes-pm]].

## Open Questions

- Does a supervised gateway (systemd/launchd) restart itself after `hermes gateway stop`, so the zero-process barrier can be broken by the supervisor? The source does not say.
- Is there an official "fix" flag set for `hermes doctor --fix` (what exactly it changes)? Not documented in the source.
- Which interpreter does the bare `python` in the `pm.sync_venv` recipe resolve to?
