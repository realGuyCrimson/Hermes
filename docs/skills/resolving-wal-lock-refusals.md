---
title: Resolving WAL Lock Refusals
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [sqlite-wal-image, state-db, enforcing-zero-process-barrier, hermes-doctor, hermes-gateway, hermes-desktop, repairing-state-db]
---

# Resolving WAL Lock Refusals (Playbook 1)

> **Symptom:** every turn fails with *"another Hermes process still holds an old copy of the session database's write-ahead log, so Hermes stopped writing to keep the file safe ..."*. **No data is lost**; processes holding a retired WAL refuse writes on purpose.

## Steps (in order)

1. **Stop every Hermes process on that profile:** `hermes gateway stop` (add `-p <profile>`), `hermes dashboard --stop`, quit the Desktop app fully from its menu, stop custom cron or service wrappers ([[enforcing-zero-process-barrier]]).
2. **Audit and terminate remaining log holders:** run `hermes doctor` (or `hermes -p <profile> doctor`) **without** `--fix`. If a process still holds the retired log it prints `PID N (command)` and skips its own probes. Terminate every listed PID and repeat until zero holder lines appear ([[hermes-doctor]]).
3. **Restart a single owner first:** `hermes gateway start` (or open Desktop) and resume the conversation.

## Notes

- A forensic folder `state.db.retired-wal-<ts>-<pid>/` (with `manifest.json`) may remain; keep it ([[state-db]]).
- Do not delete `state.db-wal` or `-shm` to "clear" the error ([[sqlite-wal-image]]).
- If problems persist after zero holders, move to [[repairing-state-db]].

## Open Questions

- How long can a retired-WAL holder stay around (is it always a zombie after crashes)?
- Can `hermes doctor` show holders across profiles in one run?
