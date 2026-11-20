---
title: Bitwarden Secrets Manager
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [external-secret-managers, configuring-secret-managers, onepassword-cli, env-file, hermes-pm, profile-isolation]
---

# Bitwarden Secrets Manager (`bws`)

> A startup-time secret source. Only one **bootstrap token** (`BWS_ACCESS_TOKEN`) stays in `.env`; provider API keys are fetched from a Bitwarden project at startup. `bws` is PM-pinned ([[hermes-pm]]).

## How it works

Hermes reads `BWS_ACCESS_TOKEN` from `.env`, runs `bws secret list <project_id>` (project is a **UUID**), and injects returned keys into `os.environ`.

## Config (`secrets.bitwarden`)

| Key | Default / notes |
|---|---|
| `server_url` | `""` for US `https://vault.bitwarden.com`; `https://vault.bitwarden.eu` for EU |
| `cache_ttl_seconds` | `300` |
| `encrypted_cache` | `{enabled: false, max_stale_seconds: 0}`; when enabled writes AES-GCM `~/.hermes/bws_cache.enc.json` and deletes plaintext `bws_cache.json` |
| `override_existing` | `true`: vault values override `.env`/shell |
| `auto_install` | `true`: lazy-install the PM-pinned `bws` |

## Commands

`hermes secrets bitwarden setup`, `test`, `token` (rotate), `disable`.

## Rules

- Never overwrites its own or another source's bootstrap token.
- Fails **open**: if `bws` or the vault is unreachable, a stderr warning is printed and existing `.env` values are kept.
- `secrets.profile_alias` and `secrets.preserve_existing` apply ([[external-secret-managers]]).
- Procedure: [[configuring-secret-managers]].

## Open Questions

- What happens to running turns when the cache is stale and the vault is offline (`max_stale_seconds: 0`)?
- Are multiple Bitwarden projects supported, or one `project_id` per profile?
