---
title: External Secret Managers
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [bitwarden-secrets-manager, onepassword-cli, configuring-secret-managers, secrets-vs-config-split, secret-isolation-strategy, profile-isolation, env-file, config-precedence]
---

# External Secret Managers

> Instead of storing provider keys in `.env`, Hermes can fetch secrets at startup from [[bitwarden-secrets-manager]] (`bws`) or [[onepassword-cli]] (`op`), keeping only a bootstrap token locally.

## Shared rules

- **Neither source may overwrite its own or another source's bootstrap token** (`BWS_ACCESS_TOKEN`, `OP_SERVICE_ACCOUNT_TOKEN`).
- **Fail open:** if the CLI or vault is unreachable, a stderr warning is printed and existing `.env` values stay.
- **Precedence among sources:** (1) `.env`/shell unless `override_existing: true`; (2) explicit `env:` mappings (1Password) over bulk project sources (Bitwarden); (3) registration order in `secrets.sources`.
- **`secrets.preserve_existing: [TELEGRAM_BOT_TOKEN, FEISHU_APP_SECRET]`** protects profile-specific `.env` tokens from being overwritten by a shared team vault.
- **`secrets.profile_alias`** (default `true`): under a named profile (e.g. `milla`), vault secrets with credential suffixes (`*_API_KEY`, `*_TOKEN`, `*_SECRET`, `*_KEY`, `*_PASSWORD`) named `FOO_MILLA` hydrate `FOO` (e.g. `TELEGRAM_BOT_TOKEN_MILLA` becomes `TELEGRAM_BOT_TOKEN`) ([[profile-isolation]]).
- Disk caches: `bws_cache.json` / `bws_cache.enc.json`, `op_cache.json` (0600) ([[hermes-home]]).
- External-source credentials are subject to the same subprocess stripping ([[secrets-vs-config-split]]).

Setup steps: [[configuring-secret-managers]]. Strategy: [[secret-isolation-strategy]]. Order of precedence against config: [[config-precedence]].

## Open Questions

- What is the exact schema of `secrets.sources` (list of names, or a list of objects)?
- Behaviour when two vault sources define the same variable and both have `override_existing: true`.
