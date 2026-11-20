---
title: Multi-Profile Deployment Strategy
type: strategy
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [profile-isolation, profile-multiplexing, managed-scope, remote-config-mode, external-secret-managers, hermes-interfaces, managing-gateway-service, installation-provenance]
---

# Multi-Profile Deployment Strategy

> **Goal:** run several bots/agents (profiles) on one host or across a fleet without cross-contamination. **Target:** hosts with multiple Hermes identities. **Approach:** one multiplexed host gateway, isolated profile state, shared listeners with prefixes, central policy where needed.

## Building blocks

1. **Isolation:** each profile has its own `config.yaml`, `.env`, `SOUL.md`, `state.db`, memories, skills, cron ([[profile-isolation]]); share `auth.json` unless `--isolated-auth`.
2. **Multiplexing:** one host gateway, one session authority per `state.db`, shared listeners under `/p/<profile>/` ([[profile-multiplexing]], [[hermes-interfaces]]).
3. **Lifecycle control:** park/unpark profiles with `hermes -p <name> gateway stop|start`; use `gateway.standalone: true` to opt a profile out ([[managing-gateway-service]]).
4. **Secrets:** a shared team vault plus `secrets.preserve_existing` (keep profile tokens) and `secrets.profile_alias` (`FOO_MILLA` to `FOO`) ([[external-secret-managers]]).
5. **Policy:** `/etc/hermes` pins for host-wide rules ([[managed-scope]]); Hermes Cloud/fleet via remote config ([[remote-config-mode]]).
6. **Deployment shape:** pick the install type that fits (Docker for immutable fleets; source for hackable hosts) ([[installation-provenance]]).

## Risks

- Forgetting `-p` operates on the default profile ([[operational-invariants]]).
- Duplicate bot tokens or ports across profiles block startup.
- A host-wide repair needs every profile's processes stopped (the barrier applies per `state.db`).

## Open Questions

- How should backups and restores be sequenced across profiles?
- Is per-profile resource limiting available (CPU/memory) when multiplexed in one process?
