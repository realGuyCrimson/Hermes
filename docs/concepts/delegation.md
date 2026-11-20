---
title: Delegation (Subagents)
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [toolsets-and-tool-registry, fallback-providers, checkpoints-and-worktrees, secrets-vs-config-split, agent-and-display-settings, hermes-online-docs]
---

# Delegation (Subagents)

> The `delegate_task` tool (one of the four agent-intercepted tools; [[toolsets-and-tool-registry]]) spawns child agents, configured under `delegation.*`.

## Config

| Key | Value |
|---|---|
| `provider`, `model` | override the model used by children |
| `api_key` | written as `${HERMES_DELEGATION_API_KEY}` ([[secrets-vs-config-split]]) |
| `max_iterations` | **50** (agent-loop docs) or **250** tool turns (delegation docs) |
| `max_concurrent_children` | **3** (overview) or **10** (delegation docs) |
| `independent_completions` | `false` |
| `worktree_isolation` | `false`; give children their own git worktrees ([[checkpoints-and-worktrees]]) |
| `fallback_providers` | per-delegation failover ([[fallback-providers]]) |

> **Contradiction:** within [[hermes-admin-deep-research]], the agent-loop docs say `delegation.max_iterations` is 50 while the delegation docs say 250 tool turns, and the overview says `max_concurrent_children` is 3 while the delegation docs say 10. Resolve by: `hermes config get delegation.max_iterations` / `delegation.max_concurrent_children` on the live install, then `DEFAULT_CONFIG` in `hermes_cli/config.py` or [[hermes-online-docs]].

## Observability

Live subagent logs: `~/.hermes/cache/delegation/live/<id>/task-<n>.log`. Vision calls from subagents are capped (`vision.max_calls_per_image` 3 for subagents; [[web-and-media-tools]]).

## Open Questions

- Which default is right (50 vs 250; 3 vs 10)? Possibly different documents describe different versions.
- Do children inherit `terminal.backend`, approvals and toolsets from the parent?
