---
title: auth.json
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [credential-pools, nous-portal, provider-resolution, profile-isolation, env-file, importing-from-other-agents, managing-credential-pools-and-fallbacks]
---

# auth.json

> `~/.hermes/auth.json`: OAuth refresh/access tokens and `credential_pool` definitions, written by `hermes auth` and OAuth login flows.

## Facts

- Holds tokens for Nous Portal, OpenAI Codex, Anthropic, xAI, Qwen and MiniMax, plus the credential pool ([[credential-pools]]).
- **Cross-process file locking** during token refreshes.
- **Shared across profiles by default**; use `--isolated-auth` to isolate a profile ([[profile-isolation]]).
- **Nous Portal quarantine:** if a refresh token is revoked or expired, Hermes quarantines it locally to prevent 401 loops. Clear it with `hermes auth add nous` or `hermes portal` ([[nous-portal]]).
- **Anthropic preference:** the `anthropic_messages` mode prefers refreshable Claude Code credentials (`~/.claude/.credentials.json`) or `auth.json` OAuth over static tokens, unless `ANTHROPIC_TOKEN` or `CLAUDE_CODE_OAUTH_TOKEN` is set ([[provider-resolution]]).
- `hermes import-agent` never reads `~/.claude/.credentials.json` or `~/.codex/auth.json` ([[importing-from-other-agents]]).
- Included in quick snapshots (`state-snapshots/`) ([[backups-and-snapshots]]).

## Agent rules

- Do not print or copy `auth.json`; do not hand-edit tokens. Use `hermes auth list|add|remove|reset|refresh` ([[managing-credential-pools-and-fallbacks]]).

## Open Questions

- Is `auth.json` per profile when `--isolated-auth` is used (path), and how is the setting remembered?
- Pool entries marked "dead" for permanently revoked grants: where is that state stored (same file)?
