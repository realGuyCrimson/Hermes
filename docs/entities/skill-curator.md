---
title: Skill Curator
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [skills-system, auxiliary-tasks, backups-and-snapshots, hermes-cli]
---

# Skill Curator

> A background auxiliary-LLM task (`hermes curator`) that reviews **agent-created** skills. It never touches bundled, hub-installed or project-local skills.

## Behaviour

- Runs every **7 days** (`interval_hours`).
- Takes a `.tar.gz` backup **before** consolidating or archiving stale skills.
- Consolidates or archives stale agent-created skills; archived skills can be restored.

## Commands

`hermes curator status`, `run [--dry-run|--background]`, `backup`, `rollback [--list|--id <ts>]`, `pause`, `resume`, `pin <skill>`, `unpin <skill>`, `restore <skill>`, `archive <skill>`, `prune`, `list-archived`.

Quick-reference rows: inspect with `hermes curator status`; mutate with `hermes curator run [--dry-run]` and `hermes curator rollback` ([[hermes-cli]]).

## Tips

- Use `run --dry-run` before real runs; `pin` skills you do not want touched.
- Roll back with `rollback --list` then `rollback --id <ts>`.

## Open Questions

- Which auxiliary task slot does the curator use (is it one of the `auxiliary.<task>` names in [[auxiliary-tasks]])? Not in the task list.
- Where are the curator backups stored and how long are they kept?
