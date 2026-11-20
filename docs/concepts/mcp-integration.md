---
title: MCP Integration
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [testing-mcp-servers, toolsets-and-tool-registry, command-approvals, cron-scheduler, browser-automation, fixing-platform-pitfalls, importing-from-other-agents, hermes-home]
---

# MCP Integration

> MCP servers are configured under `mcp_servers` in `config.yaml` and expose tools to the agent.

## Transports

- **stdio:** `command`, `args`, `env`.
- **Streamable HTTP:** `url`, `headers`, `auth: oauth` (OAuth 2.1 tokens in `~/.hermes/mcp-tokens/<server>.json`, 0600; dynamic webhook `whsec_` secrets in `mcp_event_subscriptions.json`).

Each active server exposes tools prefixed `mcp__<server>__<tool>` (capped at 64 chars) under dynamic toolset `mcp-<server>` ([[toolsets-and-tool-registry]]).

## Per-server controls (`mcp_servers.<name>`)

- `tools.include: [...]` (allowlist), `tools.exclude: [...]` (blocklist), `prompts: false`, `resources: false`.
- `trust: untrusted` forces user approval for any tool lacking `readOnlyHint: true`; **fails closed** in cron and unattended runs ([[command-approvals]], [[cron-scheduler]]).
- `tool_costs` plus `spend_limit: 100` cap per-chat credit spend.

## Commands

`hermes mcp` (interactive UI), `hermes mcp catalog`, `install <name>`, `add <name> --command ... --args ...`, `configure <name>`, `login <name>`, `test <server>`; in chat `/reload-mcp`. Approvals: `approvals.mcp_reload_confirm: true` asks before reload. Testing and exit codes: [[testing-mcp-servers]].

## WSL2 bridge to signed-in Windows Chrome

`/browser connect` across the WSL2/Windows boundary is unreliable. Launch Hermes from `/mnt/c/...` (avoids cmd.exe UNC warnings) and run:

```bash
hermes mcp add chrome-devtools-win --command cmd.exe --args /c npx -y chrome-devtools-mcp@latest --autoConnect --no-usage-statistics
```

See [[fixing-platform-pitfalls]]. Imports from other agents' MCP configs: [[importing-from-other-agents]].

## Open Questions

- How are secrets passed to stdio servers (`env` with `${VAR}`)?
- What does `tool_costs` look like (per-tool credit map)?
