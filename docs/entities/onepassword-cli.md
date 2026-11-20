---
title: 1Password CLI (op)
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [external-secret-managers, configuring-secret-managers, bitwarden-secrets-manager, env-file, hermes-home]
---

# 1Password CLI (`op`)

> Startup-time secret source using explicit `op://<vault>/<item>/<field>` mappings. Authentication via `OP_SERVICE_ACCOUNT_TOKEN`, or the desktop app if the token is unset.

## Setup and config (`secrets.onepassword`)

- `hermes secrets onepassword setup --token <token>`.
- Token read from `.env` or `~/.hermes/.op.env` (gitignored, 0600, loaded after `.env`) ([[env-file]]).
- Mappings: `secrets.onepassword.env` (env var to `op://` reference).

| Key | Default / notes |
|---|---|
| `account` | `""` |
| `binary_path` | `""`; pin the exact `op` executable |
| `cache_ttl_seconds` | `300`; `0` disables disk **and** memory caching |
| `override_existing` | `true` |

Disk cache: `~/.hermes/op_cache.json` (0600).

## Rules

- Never overwrites a bootstrap token (its own or another source's).
- Fails open to existing `.env` values with a stderr warning if the CLI or vault is unreachable.
- Explicit `env:` mappings (1Password) outrank bulk project sources (Bitwarden) ([[external-secret-managers]]).

## Open Questions

- Does `op` need to be installed separately (not listed among PM tools in [[hermes-pm]])?
- What is the behaviour with the desktop-app auth path on a headless server?
