---
title: Credential Pools
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [auth-json, managing-credential-pools-and-fallbacks, fallback-providers, provider-resilience-strategy, prompt-caching, env-file, provider-resolution]
---

# Credential Pools

> Layer 1 of resilience: multiple API keys or OAuth logins for the **same provider** rotate automatically.

## Discovery

- Numbered env vars: `OPENROUTER_API_KEY`, `OPENROUTER_API_KEY_2`, `_3`, ... ([[env-file]]).
- OAuth tokens and `credential_pool` entries in `auth.json` ([[auth-json]]).

## Rotation and cooldown rules

| Event | Behaviour |
|---|---|
| Plan/quota 429 or 402 | rotate immediately; default **1-hour** cooldown |
| Transient 429 | retry once, then rotate; 1-hour cooldown or the provider's `reset_at` |
| Anthropic 429 | cools down the key **only for that Claude model** |
| 401 | attempt token refresh, then rotate; **5-minute** cooldown |
| Permanently revoked OAuth grant | marked dead |

## Strategy

`credential_pool_strategies.<provider>`: `fill_first` (default), `round_robin`, `least_used`, `random`.

## Commands

`hermes auth list [provider]`, `add <provider> [--type api-key|oauth] [--priority <n>] [--browser]`, `priority <provider> <target> <n>` (0 is highest), `remove <provider> <index>`, `reset <provider> [target]`, `refresh <provider> [target]` ([[managing-credential-pools-and-fallbacks]]).

Rotating a key invalidates the prompt prefix cache ([[prompt-caching]]).

## Open Questions

- Can pools mix OAuth and API keys for one provider, and how are they ordered by default?
- Where is per-key cooldown state kept (memory vs `auth.json`)?
