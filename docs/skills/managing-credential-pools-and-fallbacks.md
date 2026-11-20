---
title: Managing Credential Pools and Fallbacks
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [credential-pools, fallback-providers, auxiliary-tasks, auth-json, prompt-caching, provider-resilience-strategy, nous-portal]
---

# Managing Credential Pools and Fallbacks

> Day-to-day commands for the resilience layers in [[provider-resilience-strategy]].

## Credential pools (`hermes auth`)

```bash
hermes auth list [provider]
hermes auth add <provider> [--type api-key|oauth] [--priority <n>] [--browser]
hermes auth priority <provider> <target> <n>     # 0 is highest
hermes auth remove <provider> <index>
hermes auth reset <provider> [target]            # clear cooldown/dead marks
hermes auth refresh <provider> [target]          # refresh OAuth token
```

Numbered env keys (`OPENROUTER_API_KEY_2`, ...) are auto-discovered. Strategy per provider: `credential_pool_strategies.<provider>` = `fill_first` (default), `round_robin`, `least_used`, `random` ([[credential-pools]]).

## Fallbacks (`hermes fallback`)

```bash
hermes fallback list
hermes fallback add            # ordered entries: provider, model, base_url, key_env
hermes fallback remove
hermes fallback clear
hermes fallback check          # static credential resolution
hermes fallback check --live --json   # parallel minimal test completions; exit 1 if any fail
```

([[fallback-providers]]). Auxiliary side tasks have their own `fallback_chain` ([[auxiliary-tasks]]).

## Cost warning

Rotating a key, activating a fallback, or `/model` mid-session invalidates the provider prefix cache; a session over **100,000** tokens asks for confirmation before `/model` ([[prompt-caching]]). `check --live` fires real (minimal) completions.

## Nous Portal 401 loops

Revoked refresh token quarantined: `hermes auth add nous` (or `hermes portal`) ([[nous-portal]]).

## Open Questions

- What are the interactive prompts of `hermes fallback add` (flags for non-interactive use)?
- Do `auth reset` and `auth refresh` apply to numbered env keys or only `auth.json` entries?
