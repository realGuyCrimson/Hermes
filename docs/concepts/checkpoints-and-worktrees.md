---
title: Checkpoints and Worktrees
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [delegation, backups-and-snapshots, hermes-home, system-prompt-assembly, hermes-cli]
---

# Checkpoints and Worktrees

> Two workspace safety nets: **checkpoints** (`/rollback`) and **managed git worktrees**.

## Checkpoints (`checkpoints.*`, opt-in)

Storage: `~/.hermes/checkpoints/` with `store/` (a shared bare Git repo; refs `refs/hermes/<hash>`, `indexes/<hash>`, `projects/<hash>.json`), `.last_prune`, `.checkpoints.lock`, `legacy-<ts>/`.

| Key | Default |
|---|---|
| `enabled` | **`false`** (opt-in) |
| `max_snapshots` | 20 |
| `max_total_size_mb` | 500 |
| `max_file_size_mb` | 10 |
| `auto_prune` | `true` |
| `retention_days` | 7 |
| `min_interval_hours` | 24 |

Commands: `hermes checkpoints status`, `hermes checkpoints prune`.

## Worktrees (`worktrees.*`)

Hermes-managed `.worktrees/` in repositories tracked by `~/.hermes/worktree_repos.json`, swept for stale ones every **6 hours**.

| Key | Default |
|---|---|
| `worktree_sync` | `true` |
| `worktrees.archive_dirty` | `true` |
| `archive_max_file_mb` | 50 |
| `archive_retention_days` | 30 |
| `max_total_gb` | 0 |
| `install_state_retention_days` | 14 |

Commands: `hermes worktree list [--json]`, `prune [--dry-run]`, `restore <name>`. `delegation.worktree_isolation` gives subagents their own worktrees ([[delegation]]).

Project context files are placed before worktree-specific snapshots so sibling worktrees share a cached prefix ([[system-prompt-assembly]]).

## Open Questions

- Does `/rollback` need `checkpoints.enabled: true` to work at all?
- What does `max_total_gb: 0` mean (unlimited or disabled)?
