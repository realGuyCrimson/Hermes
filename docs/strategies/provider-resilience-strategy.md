---
title: Provider Resilience Strategy
type: strategy
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [credential-pools, fallback-providers, auxiliary-tasks, prompt-caching, managing-credential-pools-and-fallbacks, provider-resolution, nous-portal]
---

# Provider Resilience Strategy

> **Goal:** conversations survive provider outages, quota limits and auth failures. **Target:** the model providers a profile depends on. **Timeframe:** continuous, per turn. **Approach:** three layers, tried from cheapest to costliest.

## The three layers

| Layer | Mechanism | Failure it absorbs | Cost |
|---|---|---|---|
| 1 | [[credential-pools]] (same provider, many keys/logins) | per-key quota, rate limit, revoked key | cache invalidation on rotation |
| 2 | [[fallback-providers]] (cross-provider primary failover) | provider outage, 401/403/404, repeated 429/5xx, reasoning stalls | cache invalidation, different model behaviour; turn-scoped |
| 3 | [[auxiliary-tasks]] chain (`auxiliary.<task>` then `fallback_chain` then main model) | side-task failures (vision, compression, titles, approvals) | isolated from the main turn |

## Trade-offs

- Every key rotation, fallback activation or mid-session `/model` forfeits the prefix cache and re-bills the whole history uncached ([[prompt-caching]]).
- Waiting beats switching when the primary's reset is soon: `fallback.min_switch_reset_seconds`.
- Failover is turn-scoped, so the primary is retried next turn.
- Cooldowns: pool defaults 1 hour (quota 429/402), 5 minutes (401).

## Verification

`hermes auth list`, `hermes fallback check`, and `hermes fallback check --live --json` (exit 1 on any failure) ([[managing-credential-pools-and-fallbacks]]).

## Open Questions

- What is the ideal pool size and priority ordering for a single-user install?
- How to alert when the primary has been failing for hours while fallbacks silently serve turns?
