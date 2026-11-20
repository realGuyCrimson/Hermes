---
title: Persistent Memory
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [system-prompt-assembly, session-lifecycle, security-settings, soul-md, hermes-home, importing-from-other-agents, toolsets-and-tool-registry]
---

# Persistent Memory

> Two small built-in files plus optional external providers. Disk writes are immediate, but the content is **frozen into the system prompt at session start**.

## Built-in files (`~/.hermes/memories/`)

| File | Content | Hard cap |
|---|---|---|
| `MEMORY.md` | agent's personal environment/project notes | **2,200 chars** (~800 tokens, 8-15 entries) |
| `USER.md` | user profile and communication preferences | **1,375 chars** (~500 tokens, 5-10 entries) |

Entries are separated by `§`. Config: `memory.memory_char_limit` 2200, `memory.user_char_limit` 1375.

## The `memory` tool

Intercepted by `agent/tool_executor.py` before registry dispatch ([[toolsets-and-tool-registry]]). Target `memory` or `user`; only three actions:

- `add`
- `patch` (unique substring replacement: `old_text` + `content`)
- `remove` (unique substring match via `old_text`)

`read` and `replace` return an error. On overflow the tool errors and requires a batch that removes or shortens entries first.

New content appears in the prompt only after `/new` or `hermes sessions refresh-prompts` ([[session-lifecycle]]).

## Config (`memory.*`)

`provider: ""` (external provider name), `memory_enabled: true`, `user_profile_enabled: true`, `memory_char_limit: 2200`, `user_char_limit: 1375`, `write_approval: false`, `prefetch_spill_enabled: false`.

## External providers (`hermes memory`)

Single-select plugins under `memory.provider`: `hermes memory setup`, `status`, `off`. Bundled: `retaindb`, `byterover`. Catalog: `honcho`, `supermemory`, `mem0`, `openviking`, `hindsight`, `holographic`. They run **alongside** `MEMORY.md`/`USER.md`. All transcripts and tool output sent to external providers pass through mandatory secret scrubbing, **even if `security.redact_secrets: false`** ([[security-settings]]).

## Imports

`hermes import-agent` seeds `MEMORY.md` from Claude Code, Codex and Cursor files ([[importing-from-other-agents]]).

## Open Questions

- How are `§` entries counted against the cap (separators included)?
- When `write_approval: true`, where do proposed writes queue (like `pending/skills/` for skills)?
