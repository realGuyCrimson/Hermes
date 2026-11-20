---
title: Profile Multiplexing
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-gateway, profile-isolation, hermes-interfaces, multi-profile-deployment-strategy, diagnosing-gateway-problems, cron-scheduler, managing-gateway-service]
---

# Profile Multiplexing

> By default one **host gateway** serves all profiles under `~/.hermes/profiles/<name>/`, binding **one session authority per profile's `state.db`** (`gateway.multiplex_profiles: true`; `false` is retired).

## Startup check

If `gateway.multiplex_profiles` is unset, the gateway verifies that no secondary profile has a running standalone daemon, a **duplicate bot token** (e.g. a shared `TELEGRAM_BOT_TOKEN`) or a conflicting port.

## Parking

- `hermes -p <name> gateway stop` writes `~/.hermes/profiles/<name>/gateway.parked`: pauses that profile's adapters **and cron jobs** without stopping the host gateway.
- `hermes -p <name> gateway start` removes the marker. The host rescans `profiles/` every **30 seconds**.
- Force an independent process with `gateway.standalone: true` in the profile's `config.yaml`.

## Shared listeners

Secondary profiles use the default profile's HTTP listeners with a `/p/<profile>/` prefix: API Server 8642, Webhooks 8644, Dashboard 9119 (all profiles), Webapp 9120, subscription proxy 8645 ([[hermes-interfaces]]).

## Exit codes

`hermes gateway run`: 75 = attached to an existing multiplexer under a supervisor; 78 = a served secondary profile refused standalone startup ([[hermes-gateway]]).

## Open Questions

- What is the migration path for a profile that previously ran as its own daemon?
- How does parking interact with the zero-process barrier (does a parked profile's `state.db` still have a holder)?
