---
title: Project Context Files
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [system-prompt-assembly, soul-md, security-settings, skills-system, prompt-caching]
---

# Project Context Files

> At startup `build_context_files_prompt()` loads **exactly one** project context file type, by first-match-wins priority. Hermes reads `CLAUDE.md` and `.cursorrules` too.

## Priority

1. `.hermes.md` / `HERMES.md`: walks up from CWD to git root; YAML frontmatter stripped.
2. `AGENTS.override.md`: personal, gitignored; replaces `AGENTS.md` in that directory.
3. `AGENTS.md`: in a git repo, a **merged, deduplicated chain** from git root down to CWD with provenance headers like `## ../../AGENTS.md`; outside a repo, CWD only.
4. `CLAUDE.md` (CWD at startup).
5. `.cursorrules` and `.cursor/rules/*.mdc` (CWD only).

## Limits and scanning

- Startup cap `context_file_max_chars` scales with the model's context window between a **20,000-char floor** and **500,000-char ceiling**; truncation keeps 70% head / 20% tail / 10% marker; read timeout `context_file_read_timeout` = 5 s.
- During a session, `SubdirectoryHintTracker` (`agent/subdirectory_hints.py`) walks up to **5 parent directories** and appends newly found subdirectory `AGENTS.md`/`CLAUDE.md` to tool results, capped at **32,000 chars**.
- **Injection scan:** every context file is scanned for prompt-injection patterns (ignore-previous-instructions, hidden HTML comments/divs, `curl ... $API_KEY`, `cat .env`, invisible Unicode). Tripping files are replaced by `[BLOCKED: <filename> contained potential prompt injection...]`. User-owned `~/.hermes/SOUL.md` warns but is not blocked ([[soul-md]]).

> **Agent note (derived):** because `CLAUDE.md` is priority 4, a `CLAUDE.md` written for Claude Code becomes Hermes context only if Hermes is started in that directory **and** no `.hermes.md`, `AGENTS.override.md` or `AGENTS.md` exists there.

## Open Questions

- Do project context files count against the stable or context tier for prompt caching when worktrees differ ([[prompt-caching]])?
- Is the scan's exact pattern list configurable or extensible?
