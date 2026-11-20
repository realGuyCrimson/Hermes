---
title: Configuring Secret Managers
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [external-secret-managers, bitwarden-secrets-manager, onepassword-cli, env-file, secrets-vs-config-split, profile-isolation]
---

# Configuring Secret Managers

> Move provider keys out of `.env` and keep only a bootstrap token. Background: [[external-secret-managers]].

## Bitwarden Secrets Manager

1. `hermes secrets bitwarden setup` (the bootstrap token is `BWS_ACCESS_TOKEN` in `.env`; the source does not say whether `setup` writes it for you).
2. Confirm `secrets.bitwarden` in `config.yaml`: the Bitwarden project ID (a UUID; the source gives the value as `<project_id>` without naming the exact config key), `server_url` (`""` US or `https://vault.bitwarden.eu`), `cache_ttl_seconds` 300, `override_existing`, `auto_install`, optional `encrypted_cache: {enabled: true, max_stale_seconds: N}`.
3. Test: `hermes secrets bitwarden test`. Rotate token: `hermes secrets bitwarden token`. Disable: `hermes secrets bitwarden disable`.

Details: [[bitwarden-secrets-manager]].

## 1Password

1. `hermes secrets onepassword setup --token <token>` (service account token in `.env` or `.op.env`), or rely on desktop-app auth if unset.
2. Map variables explicitly under `secrets.onepassword.env`: `VAR: op://<vault>/<item>/<field>`.
3. Optional `account`, `binary_path` (pin `op`), `cache_ttl_seconds` (300; `0` disables caching), `override_existing`.

Details: [[onepassword-cli]].

## Combine safely

- Order: `.env`/shell (unless `override_existing`), explicit `env:` mappings over bulk projects, then registration order in `secrets.sources`.
- Protect profile-specific tokens: `secrets.preserve_existing: [TELEGRAM_BOT_TOKEN, FEISHU_APP_SECRET]`.
- Per-profile naming: vault key `FOO_MILLA` hydrates `FOO` under profile `milla` (`secrets.profile_alias`, default true) ([[profile-isolation]]).
- Sources fail open to `.env` if unreachable; verify with `hermes config get <KEY>` (masked) after setup.

## Don't

- Don't paste tokens into chat logs or `config.yaml` ([[secrets-vs-config-split]]).

## Open Questions

- Is there a command to show which source provided a variable (provenance)?
- Is `secrets.bitwarden.project_id` a single value or a list for multi-project setups?
