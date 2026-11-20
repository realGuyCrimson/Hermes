---
title: hermes update
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [updating-hermes, hermes-pm, backups-and-snapshots, installation-provenance, hermes-gateway, plugins-and-hooks, fixing-platform-pitfalls, hermes-desktop, state-db]
---

# hermes update

> Upgrades code and runtime for **source checkouts**. It is crash-safe by design: it snapshots first, rolls back on a failed code compile, and after the "commit point" never fails the update.

Also available as `/update` in messaging chats. Package-owned installs do not use it ([[installation-provenance]]): Docker `hermes update` exits 2 (pull and recreate instead); Desktop uses its in-app updater; Termux uses `pkg update && pkg upgrade hermes-agent`.

## Channels and flags

- Official checkouts default to the **stable** channel (exact commits of published `vX.Y.Z` GitHub releases). Forks default to **main**.
- `--set-channel main|stable` persists a channel; `--channel main|stable` or `--branch <NAME>` is a one-off.
- `--check` checks availability (read-only). `--plan` prints the service restart plan across all profiles (read-only).
- `--backup` forces a full `.zip` backup of `HERMES_HOME`; `--no-backup` skips snapshots; `--yes` / `-y` accepts migrations non-interactively.

## Lifecycle

1. **Before touching git:** snapshot profile state to `state-snapshots/`; publish recovery/lock/custody modules outside the working tree to `<git dir>/hermes-update-recovery/<pre-sha>/` (with a MANIFEST of blob hashes); pause running gateways.
2. **Pull target code**, then compile every file listed under `[tool.hermes] update-startup-files` in `pyproject.toml`. If compilation fails (syntax error, merge conflict), Hermes rolls back with `git reset --hard <pre-pull-sha>`.
3. **Commit point.** The parent invokes `update_completion.py` in a child process using `python -I -S` (isolated from old site-packages) with a versioned JSON request. After this point **nothing fails the update**; exit code is 0 unless code was rolled back.
4. **Completion steps**, each independent: PM sync ([[hermes-pm]]), launcher publication, TUI/web/desktop build, config migration, `__pycache__` sweep, fleet gateway restart. A failing step prints a warning, records `{step, reason}` under `followups` in `~/.hermes/logs/update_receipts/latest.json`, and keeps *source-completion-pending* armed so the next launch or `hermes update` retries the tail.
5. **Plugin safety valve:** a plugin whose dependencies fail to resolve is moved from `plugins.enabled` to `plugins.disabled` (`plugins.disabled_by_update`) and retried on later updates ([[plugins-and-hooks]]).

## Config keys (`updates.*`)

| Key | Default / values |
|---|---|
| `updates.check` | `true` |
| `updates.pre_update_backup` | `quick`, `full` or `off` |
| `updates.backup_keep` | `5` |
| `updates.non_interactive_local_changes` | `stash` or `discard` |
| `updates.auto_switch_parked_branch` | `true` |

## Known blocker: abandoned git pack files

A killed fetch or a full disk can leave stale pack files that block updates. Procedure in [[fixing-platform-pitfalls]].

## Related

[[updating-hermes]] (procedure), [[backups-and-snapshots]], [[hermes-desktop]] (emergency `state.db` snapshot before Desktop updates).

## Open Questions

- Exactly what do `quick` vs `full` pre-update backups include, relative to `--backup`'s full zip?
- What does `non_interactive_local_changes: discard` discard (tracked edits to the checkout only)?
- Is there a supported way to roll back **after** the commit point (config migrations, PM sync)?
