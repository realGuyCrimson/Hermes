---
title: Cron Scheduler
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-gateway, command-approvals, mcp-integration, profile-multiplexing, backups-and-snapshots, hermes-cli, hermes-doctor]
---

# Cron Scheduler

> Hermes' built-in job scheduler. Runs inside the gateway (`cron.pid`), stores jobs under `~/.hermes/cron/`.

## Files

| Path | Role |
|---|---|
| `cron/jobs.json` | jobs; written by atomic rename |
| `cron/deliveries.db` | durable outbound delivery queue |
| `cron/output/` | local job outputs |
| `cron.pid` | scheduler PID |

Quick snapshots include cron jobs ([[backups-and-snapshots]]).

## Config (`cron.*`)

`model`, `model_provider`, `preflight` (true), `catch_up_missed` (true), `script_timeout_seconds` (3600), `wrap_response` (true), `delivery.notify` (true), `provider` (chronos).

## Commands

`hermes cron doctor`, `status`, `list`, `tick`; global emergency stop `hermes pause` and `hermes resume`.

## Interactions

- **Parked profiles:** `hermes -p <name> gateway stop` writes `gateway.parked`, pausing that profile's adapters **and cron jobs** ([[profile-multiplexing]]).
- **Unattended approvals:** `approvals.cron_mode` is `deny` or `approve` ([[command-approvals]]). MCP servers with `trust: untrusted` fail closed in cron ([[mcp-integration]]).
- Cron scripts run with Hermes-managed credential variables stripped ([[secrets-vs-config-split]]).

## Open Questions

- What does `hermes cron tick` do (run due jobs once, or advance state)?
- What does `preflight` check, and what does `catch_up_missed` replay after downtime?
- Is `hermes pause` global across profiles or per host gateway?
