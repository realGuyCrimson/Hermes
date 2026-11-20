---
title: Fallback Providers
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [credential-pools, auxiliary-tasks, provider-resilience-strategy, managing-credential-pools-and-fallbacks, prompt-caching, model-configuration, delegation]
---

# Fallback Providers

> Layer 2 of resilience: cross-provider failover of the **primary model**. When every key in a pool fails, or on an immediate 401/403/404, `_try_activate_fallback()` swaps model, provider, `base_url`, `api_mode` and client in place.

## Config

- `fallback_providers`: ordered list of `{provider, model, base_url, key_env}`.
- `fallback.min_switch_reset_seconds` (default 0): if the primary's 429 reset window is shorter, Hermes **waits** instead of switching.
- `delegation.fallback_providers` exists for subagents ([[delegation]]).

## Triggers

- **Immediately:** 401, 403, 404.
- **After max retries:** 429, 500, 502, 503, empty responses.
- Reasoning stalls on `codex_responses` also fail over (`incomplete_response`; [[provider-resolution]]).

## Scope

Failover is **turn-scoped**: the next user turn tries the primary again unless its rate-limit reset window has not elapsed.

## Commands

`hermes fallback add|list|remove|clear|check`. `hermes fallback check` verifies static credential resolution; `hermes fallback check --live --json` fires parallel minimal test completions against every entry and **exits 1 if any fails** ([[managing-credential-pools-and-fallbacks]]).

Failing over invalidates the prompt cache ([[prompt-caching]]).

## Open Questions

- Does `check --live` incur cost on paid providers (minimal completions)? Yes by construction; the source gives no per-call estimate.
- Are `auxiliary.<task>.fallback_chain` entries tested by `hermes fallback check` ([[auxiliary-tasks]])?
