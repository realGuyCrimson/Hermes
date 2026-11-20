---
title: Importing From Other Agents
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [persistent-memory, skills-system, mcp-integration, command-approvals, auth-json, hermes-home]
---

# Importing From Other Agents

> `hermes import-agent <source>` imports instructions, permissions, MCP servers and skills from other agents. File SHA digests are tracked per profile in `~/.hermes/import-sync.json`, which makes `hermes import-agent --sync [--dry-run]` idempotent.

## Mappings

| Source | Reads | Lands in |
|---|---|---|
| **Claude Code** (`~/.claude`, `~/.claude.json`) | global `CLAUDE.md` | `MEMORY.md` |
| | `settings.json` `permissions.allow` / `deny` `Bash(...)` rules | `command_allowlist` and `approvals.deny` ([[command-approvals]]) |
| | `mcpServers` | `mcp_servers` ([[mcp-integration]]) |
| | `skills/<name>/` | `~/.hermes/skills/claude-code-imports/<name>/` |
| **Codex CLI** (`~/.codex`) | `AGENTS.md`, `memories/*.md` | `MEMORY.md` |
| | `config.toml` `[mcp_servers.*]` | `mcp_servers` |
| | `skills/<name>/` | `~/.hermes/skills/codex-imports/<name>/` |
| **Cursor** (`~/.cursor`) | `AGENTS.md`, `rules/*.md(c)` (frontmatter stripped) | `MEMORY.md` |
| | `mcp.json` | `mcp_servers` |
| | `skills/**/<name>/` | `~/.hermes/skills/cursor-imports/<name>/` |
| **OpenClaw** (`~/.openclaw`) | everything | `hermes import-agent openclaw` or `hermes claw migrate [--migrate-secrets]` |

## Secrets

- OpenClaw with `--migrate-secrets` is the **only** importer that copies API keys and bot tokens.
- All others strip secrets and never read `~/.claude/.credentials.json` or `~/.codex/auth.json` ([[auth-json]]).

## Steps

1. `hermes import-agent <source> --dry-run` is not stated for the first run; use `--sync --dry-run` on repeat runs to preview.
2. Review resulting `MEMORY.md` and `command_allowlist` for scope: imported **allow** rules widen what runs without approval.
3. Re-run `--sync` after the source changes.

## Open Questions

- Imports target `MEMORY.md`, which has a hard **2,200-char** cap ([[persistent-memory]]). How are long `CLAUDE.md` or `AGENTS.md` files truncated or split?
- Does the import preserve `deny` precedence over `allow` when rules overlap?
