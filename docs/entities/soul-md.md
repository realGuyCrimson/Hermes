---
title: SOUL.md
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [system-prompt-assembly, context-files, persistent-memory, session-lifecycle, hermes-home, profile-isolation]
---

# SOUL.md

> `~/.hermes/SOUL.md`: the agent's global identity and voice, injected **verbatim into slot #1** of the system prompt ([[system-prompt-assembly]]). Falls back to `DEFAULT_AGENT_IDENTITY` when absent.

## Facts

- **Seeded once**; updates never overwrite it.
- **Mid-session edits do not apply** until `/new` or `hermes sessions refresh-prompts` ([[session-lifecycle]]). The system prompt is frozen at session start to preserve prompt caching ([[prompt-caching]]).
- **Injection scanning:** the user-owned file logs a warning if it matches a prompt-injection pattern ("SOUL.md ... loaded - matched prompt-injection pattern(s)"), but it is **not blocked**, unless installed from a third-party `distribution.yaml` ([[context-files]]).
- Per-profile identity lives in `profiles/<name>/SOUL.md` ([[profile-isolation]]).
- Project-level instructions are separate: `.hermes.md`, `AGENTS.md`, `CLAUDE.md` ([[context-files]]).

## Open Questions

- What is the token budget guidance for SOUL.md? It is not capped like MEMORY.md/USER.md ([[persistent-memory]]).
- How does a `distribution.yaml` install flag a third-party SOUL.md, and how would an admin see that?
