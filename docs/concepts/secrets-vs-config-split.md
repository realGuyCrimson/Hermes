---
title: Secrets vs Config Split
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [env-file, config-yaml, setting-config-values, secret-isolation-strategy, external-secret-managers, security-settings, config-precedence, operational-invariants]
---

# Secrets vs Config Split

> **Secrets live in `.env` (or `auth.json`); non-secret behaviour lives in `config.yaml`.** The split is enforced by `hermes config set` and by the way Hermes writes credentials.

## Routing rules

- Every `UPPER_SNAKE` key (e.g. `OPENROUTER_API_KEY`, `DISCORD_HOME_CHANNEL`, `HERMES_TIMEZONE`) goes to `~/.hermes/.env`, never `config.yaml` (not even with `--force`).
- Every dotted key (e.g. `terminal.backend`) is type-checked against the schema and written to `config.yaml`.
- In `config.yaml`, reference env vars with `${VAR_NAME}` or `${env:VAR_NAME}`. **A bare `$VAR` is never expanded.**

## How Hermes writes credentials

The raw secret goes to `.env`; `config.yaml` stores a `${VAR}` reference.

| Config slot | `.env` variable |
|---|---|
| `model.api_key` | `HERMES_MODEL_API_KEY` |
| `auxiliary.<task>.api_key` | `AUXILIARY_<TASK>_API_KEY` |
| `delegation.api_key` | `HERMES_DELEGATION_API_KEY` |
| custom endpoint `api_key` | `HERMES_CUSTOM_<HOST>[_<PORT>][_<PATH>]_<HASH>_API_KEY` |
| named provider `api_key` | `HERMES_PROVIDER_<NAME>_<HASH>_API_KEY` |

`<HASH>` is an 8-hex-char digest of the URL or name, to prevent host collisions.

## Display and exposure

- `hermes config get` **masks** credential-shaped keys (`api_key`, `*_TOKEN`, `*_SECRET`, `password`), e.g. `sk-o...7890`; `--raw` prints the real value.
- All Hermes-managed credential variables are **stripped from child subprocesses** (terminal, `execute_code`, cron scripts) even when `env_passthrough` is on.
- `security.redact_secrets` (default true) and secret scrubbing for external memory providers ([[security-settings]], [[persistent-memory]]).
- `errors.log` redacts secrets automatically.

## Do and don't

| Do | Don't |
|---|---|
| `hermes config set OPENROUTER_API_KEY sk-or-...` | paste keys into `config.yaml` |
| `api_key: ${HERMES_MODEL_API_KEY}` | `api_key: $HERMES_MODEL_API_KEY` |
| use a secret manager for team keys ([[external-secret-managers]]) | commit `.env` or `.op.env` |

See the layered defence in [[secret-isolation-strategy]].

## Open Questions

- Which non-credential `UPPER_SNAKE` keys are meant to live in `.env` (e.g. `HERMES_TIMEZONE`) versus having a dotted equivalent?
- Does the `${VAR}` substitution also apply inside `mcp_servers.<name>.env` and `headers`?
