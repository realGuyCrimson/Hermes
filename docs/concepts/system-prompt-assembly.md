---
title: System Prompt Assembly
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [prompt-caching, soul-md, context-files, persistent-memory, skills-system, session-lifecycle, agent-and-display-settings]
---

# System Prompt Assembly

> `agent/prompt_builder.py` and `agent/system_prompt.py` build a **cached** system prompt at session start in three ordered tiers (Stable, Context, Volatile) across 10 layers, so provider-side prefix caches (Anthropic 1-hour, OpenAI/Codex) keep hitting ([[prompt-caching]]).

## The 10 layers

| Tier | # | Layer |
|---|---|---|
| **Stable** | 1 | Agent identity: [[soul-md]] or `DEFAULT_AGENT_IDENTITY` |
| | 2 | Tool-aware behaviour guidance and coding brief |
| | 3 | Skills index `<available_skills>` ([[skills-system]]) |
| **Context** | 4 | Caller-supplied `system_message` / `agent.system_prompt` |
| | 5 | Project context files (shared repo files **before** git-worktree snapshots, so sibling worktrees share a cached prefix; [[context-files]]) |
| | 6 | Operator instructions and surface-specific `platform_hints` |
| **Volatile** | 7 | Frozen `MEMORY.md` snapshot (`## Persistent Memory`; [[persistent-memory]]) |
| | 8 | Frozen `USER.md` snapshot (`## User Profile`) |
| | 9 | External memory-provider static block |
| | 10 | Session metadata plus `# Hermes runtime environment` (host, home, CWD); always ends the volatile tier and is checked by `_stored_prompt_matches_runtime()` |

## Ephemeral overlays (never persisted in the cached prompt)

`HERMES_EPHEMERAL_SYSTEM_PROMPT`, prefill messages, later-turn external-memory `prefetch()` recall, `pre_llm_call` plugin context, mid-session surface-switch notes (`agent/surface_switch.py`), and mid-session `<available_skills>` delta notes (`agent/skills_index_delta.py`). They are injected on the **current turn's user-message channel**, so the system prompt bytes never mutate mid-session.

## Practical consequences

- Edits to `SOUL.md`, `MEMORY.md`, `USER.md`, skills index do not show until `/new` or `hermes sessions refresh-prompts` ([[session-lifecycle]]).
- Moving the working directory or host changes layer 10 and can invalidate a stored prompt.

## Open Questions

- What does `_stored_prompt_matches_runtime()` do on mismatch (rebuild, warn)?
- Where does `agent.personalities` text land in these layers ([[agent-and-display-settings]])?
