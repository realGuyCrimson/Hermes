---
title: Command Approvals and the Hardline Blocklist
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [terminal-backends, security-settings, mcp-integration, cron-scheduler, operational-invariants, toolsets-and-tool-registry, auxiliary-tasks]
---

# Command Approvals and the Hardline Blocklist

> A configurable approval layer sits above an **unconditional** Hardline Blocklist.

## Dangerous patterns

On `local` and `ssh` terminal backends, commands are checked against `DANGEROUS_PATTERNS`: `rm -rf`, `mkfs`, `dd`, `DROP TABLE`, `> /etc/`, `systemctl stop`, `curl | sh`, and more. Container-style backends (docker, modal, daytona, vercel_sandbox, singularity, sprites) **skip approval prompts** because the container is the boundary ([[terminal-backends]]).

## Hardline Blocklist (`tools/approval.py::UNRECOVERABLE_BLOCKLIST`)

Always blocked; **not bypassable by `--yolo`, `/yolo` or `approvals.mode: off`**: `rm -rf /`, the fork bomb `:(){ :|:& };:`, `mkfs.*` on root, `dd if=/dev/zero of=/dev/sd*`, malformed shell quoting, and **killing the supervised gateway's own Python interpreter** (`pkill -9 python3`, `killall python`, `taskkill /F /IM python.exe` under `HERMES_SUPERVISED_CHILD`).

## Config

| Key | Default / values |
|---|---|
| `approvals.mode` | `smart` (default), `manual`, `off` |
| `approvals.timeout` | `300` |
| `approvals.discord_prompt_timeout` | `300` |
| `approvals.cron_mode`, `single_query_mode`, `unattended_mode` | `deny` or `approve` |
| `approvals.approvers` | `["*"]` |
| `approvals.denial_breaker_threshold` | `3` |
| `approvals.deny` | glob list of unconditionally blocked shell commands |
| `approvals.smart_policy` | string (LLM approval policy; uses `auxiliary.approval`, [[auxiliary-tasks]]) |
| `approvals.mcp_reload_confirm` | `true` |
| `approvals.destructive_slash_confirm` | `true` |
| `command_allowlist` | permanent approved command patterns |

## Mining an allowlist

`hermes approvals suggest` is a dry run over the last 90 days of `state.db` approvals; `hermes approvals suggest --apply 1,3` writes chosen suggestions into `command_allowlist`, automatically excluding destructive classes and masking tokens.

## Related

MCP tools with `trust: untrusted` need approval and fail closed in cron ([[mcp-integration]], [[cron-scheduler]]). Security defaults: [[security-settings]]. Admin-side hard stops: [[operational-invariants]].

## Open Questions

- What does `approvals.mode: smart` consult by default (LLM-based risk score, rules)?
- Does `approvals.deny` accept the same glob syntax as `command_allowlist`?
