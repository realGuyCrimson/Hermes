---
title: Skills System
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [skill-curator, importing-from-other-agents, system-prompt-assembly, persistent-memory, hermes-home, plugins-and-hooks, security-settings, context-files]
---

# Skills System

> Procedural knowledge as `SKILL.md` documents following the agentskills.io open standard: YAML frontmatter plus Markdown (`# Title`, `## When to Use`, `## Procedure`, `## Pitfalls`, `## Verification`).

## Progressive disclosure

| Level | Call | What it loads |
|---|---|---|
| 0 | `skills_list()` | ~3k-token index in the system prompt (`<available_skills>`) |
| 1 | `skill_view(name)` | full `SKILL.md` |
| 2 | `skill_view(name, path)` | files under `references/`, `templates/`, `scripts/` |

## Directory precedence

project (`<repo>/.hermes/skills/` or `.agents/skills/`, requires `hermes skills trust`) > local (`~/.hermes/skills/`) > `skills.create_dir` > `external_dirs`. A duplicate name at a higher level **shadows** lower levels; duplicates **within the same directory** fail with an ambiguity error.

## Skill frontmatter capabilities

- OS visibility: `platforms: [macos, linux, windows]`.
- Tool gating: `requires_toolsets`, `requires_tools`, `fallback_for_toolsets`, `fallback_for_tools`.
- Secrets: `required_environment_variables` (auto-forwarded to sandboxes); mounted files: `required_credential_files`.
- Non-secret settings: `metadata.hermes.config`, stored under `skills.config.<key>` in `config.yaml` and auto-injected on load.

## Config (`skills.*`)

`create_dir`, `auto_load` (skills preloaded every session), `disabled`, `platform_disabled.<platform>` (e.g. `telegram`, to stay under Telegram's **100-command cap**), `trusted_project_dirs`, `project_discovery` (true), `guard_agent_created` (false), `write_approval` (false; staged in `pending/skills/`), `template_vars` (true), `inline_shell` (false), `config.<skill>.<key>`.

## Management (`hermes skills ...`)

`browse`, `search`, `inspect`, `install`, `list`, `check`, `update`, `audit`, `uninstall`, `reset`, `opt-out`, `opt-in`, `publish`, `snapshot`, `tap`, `config`, `trust`, `untrust`.

- Edited bundled skills are flagged **`user_modified`** and skipped on updates; `hermes skills reset <name> --restore` brings back the bundled version.
- **Opt out of bundled skills on a profile:** `hermes skills opt-out [--remove]` (creates `.no-bundled-skills`); `hermes skills opt-in --sync` re-seeds.
- **Bundles:** `skill-bundles/<slug>.yaml` group skills under one `/<bundle-name>` slash command (`hermes bundles list`).
- The [[skill-curator]] reviews agent-created skills only.
- Cross-agent imports land in `claude-code-imports/`, `codex-imports/`, `cursor-imports/` ([[importing-from-other-agents]]).

## Open Questions

- What does `hermes skills audit` check (security scan, duplicates, frontmatter)?
- How do `skills.inline_shell` and `template_vars` interact with the injection scanner ([[context-files]])?
